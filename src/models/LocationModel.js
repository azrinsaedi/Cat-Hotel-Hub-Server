import mongoose from "mongoose";
const LocationSchema = new mongoose.Schema(
  { city: { type: String }, country: { type: String } },
  { timestamps: true }
);

export default mongoose.model("Location", LocationSchema);
