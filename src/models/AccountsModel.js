import mongoose from "mongoose";
const AccountsSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, unique: true },
    lastName: {
      type: String,
      default: "lastName",
    },
    location: {
      type: String,
      default: "my city",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: String,
    avatarPublicId: String,
    forgotPassword: { type: String, default: null },
    wishlist: [{ type: String }],
  },
  { timestamps: true }
);
export default mongoose.model("Accounts", AccountsSchema);
