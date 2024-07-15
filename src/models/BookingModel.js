import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const BookingSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
      default: uuidv4,
    },
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
    extraServices: [
      {
        type: mongoose.Types.ObjectId,
        // ref: "ExtraServices",
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
    occupied_rooms: Number,
    deleted: { type: Boolean, default: false },
    currency: { type: String },
    price_in_cents: { type: Number },
    payment_ID: { type: String },
    payment_type: { enum: ["stripe"] },
  },
  { timestamps: true }
);

BookingSchema.pre("save", function (next) {
  if (!this.transactionId) {
    this.transactionId = uuidv4();
  }
  next();
});

export default mongoose.model("Booking", BookingSchema);
