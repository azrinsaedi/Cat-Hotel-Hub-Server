import mongoose from "mongoose";
const BookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
    },
    hotel: {
      type: mongoose.Types.ObjectId,
      ref: "Hotel",
    },
    check_in: Date,
    check_out: Date,
    cats: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Cats",
      },
    ],
    cancelledBy: {
      type: String,
      enum: ["admin", "customer"],
    },
    status: {
      type: String,
      enum: ["Cancelled", "Approved", "Pending"],
    },
    rating: { type: Number, default: null },
    comment: { type: String, default: null },
    occupied_rooms: Number,
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model("Booking", BookingSchema);
