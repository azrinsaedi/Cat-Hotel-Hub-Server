import express from "express";
import * as dotenv from "dotenv";
import morgan from "morgan";
import "express-async-errors";
import mongoose from "mongoose";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.js";
import { authenticateUser } from "./middleware/authMiddleware.js";
import adminRouter from "./routes/adminRouter.js";
import accountRouter from "./routes/accountRouter.js";
import publicRouter from "./routes/publicRouter.js";
import authRouter from "./routes/authRouter.js";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import MessagesModel from "./models/MessagesModel.js";
import http from "http";

import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// import https from "https";
// import fs from "fs";

import cors from "cors";
import { StatusCodes } from "http-status-codes";

dotenv.config();
const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "./public")));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.use(
  cors({
    origin: "https://localhost:5173", // Update with your client URL
    credentials: true,
  })
);

app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(errorHandlerMiddleware);

app.use(helmet());
app.use(mongoSanitize());

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/customer/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/booking", adminRouter);
app.use("/api/v1/public", publicRouter);

// app.use("*", (req, res) => {
//   res.status(404).json({ msg: "not found" });
// });

app.use(express.static(path.resolve(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({ error: message });
});

// app.use((err, req, res, next) => {
//   console.log(err);
//   res.status(500).json({ msg: "something went wrong" });
// });

// Load SSL certificate and key
// const options = {
//   key: fs.readFileSync("https/private-key.key"),
//   cert: fs.readFileSync("https/ssl-certificate.crt"),
//   // key: fs.readFileSync("https/server.key"),
//   // cert: fs.readFileSync("https/server.crt"),
// };

const port = process.env.PORT || 5100;
// const port = process.env.PORT || 443;
// Create HTTPS server
// const server = https.createServer(options, app);

const server = http.createServer(app); // Create an HTTP server
const io = new SocketIOServer(server, {
  cors: {
    origin: "https://localhost:5173", // Update with your client URL
    methods: ["GET", "POST"],
    credentials: true,
  },
}); // Initialize Socket.IO with CORS settings

io.on("connection", async (socket) => {
  console.log("a user connected");

  // Replace with a proper user authentication and identification mechanism
  const userId = socket.handshake.query.userId;
  console.log("userIdAA", userId);
  try {
    const messages = await MessagesModel.find({
      $or: [{ senderId: userId }, { recipientId: userId }],
    }).sort({ timestamp: 1 });

    socket.emit("init", messages);
  } catch (err) {
    console.error(err);
  }

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("message", async (msg) => {
    console.log("msg", msg);
    try {
      const message = new MessagesModel({
        content: msg.content,
        senderId: msg.userId,
        recipientId: msg.recipientId,
        // roomId: msg.roomId,
        timestamp: new Date(),
        status: "sent",
      });

      await message.save();
      io.emit("message", message); // Broadcast the message to all connected clients
    } catch (err) {
      console.error(err);
    }
  });
});

try {
  await mongoose.connect(process.env.MONGO_URL);
  server.listen(port, () => {
    console.log(`server running on PORT ${port}....`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}

// try {
//   await mongoose.connect(process.env.MONGO_URL);
//   app.listen(port, () => {
//     console.log(`server running on PORT ${port}....`);
//   });

//   // server.listen(port, () => {
//   //   console.log(`server running on PORT ${port}....`);
//   // });
// } catch (error) {
//   console.log(error);
//   process.exit(1);
// }
