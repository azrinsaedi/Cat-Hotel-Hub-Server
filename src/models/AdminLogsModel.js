import mongoose from "mongoose";
const AdminLogsSchema = new mongoose.Schema(
  {
    case: String,
  },
  { timestamps: true }
);
export default mongoose.model("AdminLogs", AdminLogsSchema);
