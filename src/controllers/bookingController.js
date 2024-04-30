import { nanoid } from "nanoid";

let hotels = [
  {
    id: nanoid(),
    hotel: "Ampang Cat Hotel",
    company: "Azrin's Company",
  },
  { id: nanoid(), hotel: "Gombak Cat Hotel", company: "Mimi Company" },
];

export const createBooking = async (req, res) => {
  const { company, hotel } = req.body;

  if (!company || !hotel) {
    return res.status(400).json({ msg: "please provide company and position" });
  }
  const id = nanoid(10);
  const hotelData = { id, company, hotel };
  hotels.push(hotelData);
  res.status(200).json({ hotelData });
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  const hotelData = hotels.find((hotel) => hotel.id === id);
  if (!hotelData) {
    return res.status(404).json({ msg: `no hotel with id ${id}` });
  }
  const newHotel = hotelData.filter((hotel) => hotel.id !== id);
  hotels = newHotel;

  res.status(200).json({ msg: "hotel deleted" });
};
