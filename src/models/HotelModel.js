import mongoose from "mongoose";
const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    total_rooms: Number,
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    tag: { type: String },
    deleted: { type: Boolean, default: false },
    price: {
      amount: { type: Number, min: 0 },
      currency: { type: String },
      discountInPercentage: { type: Number, min: 0, max: 100 },
    },
    images: [{ type: String }],
    location: {
      country: String,
      state: String,
      city: String,
      postcode: String,
      addressLine1: String,
      addressLine2: String,
    },
    description: { type: String },
    requirements: { vaccine: String, microchipped: String },
    // extraServices: [
    //   {
    //     type: mongoose.Types.ObjectId,
    //     ref: "ExtraServices",
    //   },
    // ],
    extraServices: [
      {
        service: String,
        price: String,
        serviceDescription: String,
      },
    ],
  },
  { timestamps: true }
);


HotelSchema.virtual("ratings", {
  ref: "Rating",
  localField: "_id",
  foreignField: "hotel",
});

HotelSchema.set("toJSON", { virtuals: true });
HotelSchema.set("toObject", { virtuals: true });
export default mongoose.model("Hotel", HotelSchema);
