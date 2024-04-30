import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    role: String,
    avatar: String,
    avatarPublicId: String,
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    forgotPassword: { type: String, default: null },
  },
  { timestamps: true }
);
export default mongoose.model("Admin", AdminSchema);
