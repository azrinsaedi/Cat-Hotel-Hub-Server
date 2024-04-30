import HotelModel from "../models/HotelModel.js";

export const viewHotels = async (req, res) => {
  const hotels = await HotelModel.find({});
  res.send({ hotels });
};

export const bookHotel = async (req, res) => {
  const { id } = req.params;
  const hotel = await HotelModel.findById(id);
  res.send({ hotel });
};
