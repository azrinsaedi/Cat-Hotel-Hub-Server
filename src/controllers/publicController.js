import mongoose from "mongoose";
import HotelModel from "../models/HotelModel.js";
import RatingModel from "../models/RatingModel.js";
import BookingModel from "../models/BookingModel.js";

export const viewHotels = async (req, res) => {
  const { location, name, check_in, check_out, cats } = req.query;
  //later change name to name and location to location
  let searchQuery = {};

  if (name) {
    searchQuery.name = new RegExp(name, "i");
  }

  // if (location) {
  //   searchQuery.location = location;
  // }

  console.log(searchQuery);

  // const hotels = await HotelModel.find(searchQuery);

  // res.send({ hotels });

  try {
    const hotels = await HotelModel.find(searchQuery)
      .populate({
        path: "ratings",
        select: "rating comment title customer",
        populate: {
          path: "customer",
          select: "name", // Assuming Accounts schema has a name field
        },
      })
      .exec();

    const hotelRatings = hotels.map((hotel) => {
      const ratings = hotel.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
        : 0;
      return {
        ...hotel.toObject(),
        averageRating,
        totalRatings,
      };
    });

    res.send({ hotels: hotelRatings });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching hotels" });
  }
};

export const bookHotel = async (req, res) => {
  const { id } = req.params;

  const hotel = await HotelModel.findById(id);
  const booking = await BookingModel.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(id), // Match based on the current user's ID
      },
    },
    {
      $group: {
        _id: "$hotel",
        count: { $sum: 1 },
      },
    },
    {
      $facet: {
        results: [{ $limit: 1 }],
        default: [{ $addFields: { count: 0 } }],
      },
    },
    {
      $project: {
        count: {
          $ifNull: [{ $arrayElemAt: ["$results.count", 0] }, 0],
        },
      },
    },
  ]);
  const rating = await RatingModel.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "accounts", // Assuming the name of your customer model
        localField: "customer",
        foreignField: "_id",
        as: "accountDetails",
      },
    },
    {
      $addFields: {
        customerName: {
          $cond: {
            if: { $gt: [{ $size: "$accountDetails" }, 0] }, // Check if customerDetails array is not empty
            then: { $arrayElemAt: ["$accountDetails.name", 0] }, // Get the name if available
            else: "Anonymous", // Set to "Anonymous" if not available
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1, // Sort createdAt field in descending order (latest first)
      },
    },
    {
      $group: {
        _id: "$hotel",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
        ratings: {
          $push: {
            customer: "$customer",
            customerName: "$customerName", // Use the derived customerName field
            comment: "$comment",
            title: "$title",
            createdAt: "$createdAt",
            rating: "$rating",
          },
        },
      },
    },
  ]);
  console.log(booking);
  res.send({ hotel, rating: rating[0], booking: booking[0] });
};
