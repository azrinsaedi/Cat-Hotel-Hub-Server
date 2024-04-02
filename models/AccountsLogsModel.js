import mongoose from "mongoose";
const AccountsLogsSchema = new mongoose.Schema(
  {
    case: String,
  },
  { timestamps: true }
);
export default mongoose.model("AccountsLogs", AccountsLogsSchema);
