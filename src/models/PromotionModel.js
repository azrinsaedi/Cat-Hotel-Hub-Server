import mongoose from "mongoose";
const LocationSchema = new mongoose.Schema(
  {
    code: { type: String },
    discountInPercentage: { type: Number },
    hotel: [{ type: mongoose.Types.ObjectId, ref: "Hotel" }],
  },
  { timestamps: true }
);

export default mongoose.model("Location", LocationSchema);
