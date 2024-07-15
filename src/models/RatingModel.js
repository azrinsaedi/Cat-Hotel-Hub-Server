import mongoose from "mongoose";
const RatingSchema = new mongoose.Schema(
  {
    rating: { type: Number },
    comment: { type: String },
    title: { type: String },
    hotel: { type: mongoose.Types.ObjectId, ref: "Hotel" },
    customer: { type: mongoose.Types.ObjectId, ref: "Accounts" },
  },
  { timestamps: true }
);

export default mongoose.model("Rating", RatingSchema);
