import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Types.ObjectId, ref: "Accounts" },
    notificationText: { type: String },
  },
  { timestamps: true }
);
export default mongoose.model("Notification", NotificationSchema);
