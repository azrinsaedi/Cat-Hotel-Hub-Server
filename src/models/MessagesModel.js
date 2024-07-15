import mongoose from "mongoose";
const MessagesSchema = new mongoose.Schema({
  content: { type: String, required: true },
  senderId: { type: String, required: true },
  recipientId: { type: String }, // Optional, useful for direct messages
  //   roomId: { type: String }, // Optional, useful for group messages
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: "sent" }, // Possible values: 'sent', 'delivered', 'read'
});

export default mongoose.model("Messages", MessagesSchema);
