import mongoose from "mongoose";
const CatsSchema = new mongoose.Schema(
  {
    name: String,
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customers",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Cats", CatsSchema);
