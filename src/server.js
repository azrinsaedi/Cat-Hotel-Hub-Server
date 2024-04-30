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
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// import https from "https";
// import fs from "fs";

import cors from "cors";

dotenv.config();
const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "./public")));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.use(cors());

app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(errorHandlerMiddleware);
app.use(express.json());

app.use(helmet());
app.use(mongoSanitize());

app.use(morgan("dev"));

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

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ msg: "something went wrong" });
});

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
try {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`server running on PORT ${port}....`);
  });

  // server.listen(port, () => {
  //   console.log(`server running on PORT ${port}....`);
  // });
} catch (error) {
  console.log(error);
  process.exit(1);
}
