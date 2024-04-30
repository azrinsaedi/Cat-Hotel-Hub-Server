import mongoose from "mongoose";
const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    total_rooms: Number,
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    deleted: { type: Boolean, default: false },
    priceInCents: { type: Number },
    currency: { type: String },
  },
  { timestamps: true }
);
export default mongoose.model("Hotel", HotelSchema);
