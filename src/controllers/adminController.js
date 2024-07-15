import HotelModel from "../models/HotelModel.js";
import AdminModel from "../models/AdminModel.js";
import { StatusCodes } from "http-status-codes";
import { UnauthenticatedError } from "../errors/customErrors.js";
import nodemailer from "nodemailer";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT, verifyJWT } from "../utils/tokenUtils.js";
import { createCookie, removeCookie } from "../utils/cookieUtils.js";
import CompanyModel from "../models/CompanyModel.js";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import BookingModel from "../models/BookingModel.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";
import day from "dayjs";
import { formatImage } from "../middleware/multerMiddleware.js";

export const getCurrentAdmin = async (req, res) => {
  const user = await AdminModel.findOne({ _id: req.user.userId });
  // console.log(user);
  res.status(StatusCodes.OK).json({ user });
};

export const registerAdmin = async (req, res) => {
  // first registered user is an master

  const isFirstAccount = (await AdminModel.countDocuments()) === 0;
  req.body.role = isFirstAccount ? "master" : "admin";

  const hashedPassword = await hashPassword(req.body.password);
  req.body.password = hashedPassword;

  const { username, name, email, password, company, role } = req.body;

  if (await AdminModel.findOne({ username: username })) {
    res.status(400).send("Username already used");
    return;
  }

  if (await AdminModel.findOne({ email: email })) {
    res.status(400).send("Email already used");
    return;
  }

  let companyId = await CompanyModel.findOne({ name: company });

  if (companyId === null) {
    companyId = await CompanyModel.create({ name: company });
  }

  const admin = await AdminModel.create({
    username: username,
    name: name,
    email: email,
    password: password,
    company: companyId,
    role: role,
  });
  res.status(StatusCodes.CREATED).json({ admin });
};

export const loginAdmin = async (req, res) => {
  const admin = await AdminModel.findOne({ email: req.body.email });
  // console.log(admin);
  const password = req.body.password;
  const tokenData = createJWT({ userId: admin._id, role: admin.role });
  const isValidAdmin =
    admin && (await comparePassword(password, admin.password));
  if (!isValidAdmin) throw new UnauthenticatedError("invalid credentials");

  createCookie({ tokenName: "tokenAdmin", tokenData, res });

  res.status(StatusCodes.CREATED).json({ msg: "admin logged in" });
};

export const logoutAdmin = (req, res) => {
  removeCookie({ tokenName: "tokenAdmin", tokenData: "logoutAdmin", res });
  res.status(StatusCodes.OK).json({ msg: "admin logged out!" });
};

export const forgotPasswordAdmin = async (req, res) => {
  //check email format in middleware
  const email = req.body.email;

  const code = nanoid(10);

  const updatedForgotPassword = await AdminModel.findOneAndUpdate(
    { email: email },
    { forgotPassword: code }
  );

  if (!updatedForgotPassword) {
    res.send("Email not found");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.ADMIN_SENDER_EMAIL,
      pass: process.env.ADMIN_SENDER_PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.ADMIN_SENDER_EMAIL,
    to: email,
    subject: "Forgot password link",
    text: `http://localhost:5100/admin/forgot-password/${updatedForgotPassword._id}/${code}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.status(StatusCodes.OK).json({
    msg: `http://localhost:5100/admin/forgot-password/${updatedForgotPassword._id}/${code}`,
  });
};

export const executeForgotPasswordAdmin = async (req, res) => {
  const { id, token } = req.params;
  const email = (await AdminModel.findOne({ _id: id, forgotPassword: token }))
    ?.email;
  if (email === undefined) {
    res.send("Token is wrong");
    return;
  }
  // console.log(id, token, email);
  res.send(`Admin ID is ${id} and code ${token} and email ${email}`);
};

export const changePasswordAdmin = async (req, res) => {
  //middleware to check password and confirm password
  const { id, token } = req.body;

  const hashedPassword = await hashPassword(req.body.password);

  const updatedAdminPassword = await AdminModel.findOneAndUpdate(
    { _id: id, forgotPassword: token },
    { password: hashedPassword, forgotPassword: null }
  );
  res.send(`Admin updated ${updatedAdminPassword}`);
};

export const updateAdmin = async (req, res) => {
  const newAdmin = { ...req.body };
  delete newAdmin.password;

  if (req.file) {
    // const response = await cloudinary.v2.uploader.upload(req.file.path);
    // await fs.unlink(req.file.path);
    const file = formatImage(req.file);
    const response = await cloudinary.v2.uploader.upload(file);
    // console.log("response", response);
    newAdmin.avatar = response.secure_url;
    // newAdmin.avatarPublicId = response.public_id;
  }

  const updatedAdmin = await AdminModel.findByIdAndUpdate(
    req.user.userId,
    newAdmin
  );
  if (req.file && updatedAdmin.avatarPublicId) {
    await cloudinary.v2.uploader.destroy(updatedAdmin.avatarPublicId);
  }

  res.status(StatusCodes.OK).json(updatedAdmin);
};

export const addHotel = async (req, res) => {
  const newHotel = { ...req.body };
  console.log("newHotel", newHotel);

  // const { name, total_rooms } = req.body;

  const { userId, role } = req.user;

  // console.log(req);

  // if (req.files) {
  //   // const response = await cloudinary.v2.uploader.upload(req.file.path);
  //   // await fs.unlink(req.file.path);
  //   const files = formatImage(req.files);
  //   const response = await cloudinary.v2.uploader.upload(files);
  //   newHotel.mainImage = response.secure_url;
  //   newHotel.mainImagePublicID = response.public_id;
  // }

  if (req.files && req.files.length > 0) {
    try {
      // Map through each uploaded file and upload it to Cloudinary
      const uploadPromises = req.files.map(async (file) => {
        const formattedFile = formatImage(file);
        const response = await cloudinary.v2.uploader.upload(formattedFile);
        return response.secure_url; // Return the secure URL of each uploaded file
      });

      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(uploadPromises);

      // Assign the uploaded images to the newHotel object
      newHotel.images = uploadedImages;
    } catch (error) {
      console.error("Error uploading images:", error);
      return res.status(500).json({ msg: "Error uploading images" });
    }
  }

  const {
    name,
    total_rooms,
    images,
    country,
    state,
    city,
    addressLine1,
    addressLine2,
    postcode,
    description,
    currency,
    amount,
    vaccine,
    microchipped,
    discount,
  } = newHotel;

  let { extraServices } = newHotel;

  // console.log("newHotel", newHotel);

  const company = (
    await AdminModel.findOne({
      _id: userId,
    }).populate("company")
  ).company;

  if (!company || !name || !total_rooms) {
    return res
      .status(400)
      .json({ msg: "please provide company, name and total rooms" });
  }

  extraServices = JSON.parse(extraServices);

  try {
    const hotel = await HotelModel.create({
      company,
      total_rooms,
      name,
      images,
      location: { country, state, city, addressLine1, addressLine2, postcode },
      description,
      price: { amount, currency, discountInPercentage: discount },
      requirements: { vaccine, microchipped },
      extraServices,
    });
    res.status(201).json({ hotel });
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};

// export const addHotel = async (req, res) => {
//   const newHotel = { ...req.body };
//   console.log("newHotel", newHotel);

//   // const { name, total_rooms } = req.body;

//   const {
//     name,
//     total_rooms,

//     country,
//     state,
//     city,
//     addressLine1,
//     addressLine2,
//     postcode,
//     description,
//     currency,
//     amount,
//     vaccine,
//     discount,
//   } = newHotel;

//   let { images, extraServices } = newHotel;

//   const { userId, role } = req.user;

//   // console.log(req);

//   // if (req.files) {
//   //   // const response = await cloudinary.v2.uploader.upload(req.file.path);
//   //   // await fs.unlink(req.file.path);
//   //   const files = formatImage(req.files);
//   //   const response = await cloudinary.v2.uploader.upload(files);
//   //   newHotel.mainImage = response.secure_url;
//   //   newHotel.mainImagePublicID = response.public_id;
//   // }

//   if (req.files && req.files.length > 0) {
//     try {
//       // Map through each uploaded file and upload it to Cloudinary
//       const uploadPromises = req.files.map(async (file) => {
//         const formattedFile = formatImage(file);
//         const response = await cloudinary.v2.uploader.upload(formattedFile);
//         return response.secure_url; // Return the secure URL of each uploaded file
//       });

//       // Wait for all uploads to complete
//       const uploadedImages = await Promise.all(uploadPromises);

//       // Assign the uploaded images to the newHotel object
//       newHotel.images = uploadedImages;
//     } catch (error) {
//       console.error("Error uploading images:", error);
//       return res.status(500).json({ msg: "Error uploading images" });
//     }
//   }

//   // const {
//   //   name,
//   //   total_rooms,
//   //   images,
//   //   country,
//   //   state,
//   //   city,
//   //   addressLine1,
//   //   addressLine2,
//   //   postcode,
//   //   description,
//   //   currency,
//   //   amount,
//   //   vaccine,
//   //   discount,
//   //   extraServices,
//   // } = req.body;
//   extraServices = JSON.parse(extraServices);
//   console.log("extraServices", typeof extraServices);

//   console.log("newHotel", newHotel);

//   const company = (
//     await AdminModel.findOne({
//       _id: userId,
//     }).populate("company")
//   ).company;

//   if (!company || !name || !total_rooms) {
//     return res
//       .status(400)
//       .json({ msg: "please provide company, name and total rooms" });
//   }

//   try {
//     const hotel = await HotelModel.create({
//       company,
//       total_rooms,
//       name,
//       images,
//       location: { country, state, city, addressLine1, addressLine2, postcode },
//       description,
//       price: { amount, currency, discountInPercentage: discount },
//       requirements: { vaccine },
//       extraServices,
//     });
//     res.status(201).json({ hotel });
//   } catch (error) {
//     res.status(500).json({ msg: "server error" });
//   }
// };

export const showAllHotels = async (req, res) => {
  const { search, total_rooms, name, sort } = req.query;

  const { userId, role } = req.user;

  const company = (
    await AdminModel.findOne({
      _id: userId,
    }).populate("company")
  ).company;

  // console.log(company);

  const queryObject = {
    company: company._id,
    deleted: false,
  };

  if (search) {
    queryObject.$or = [
      // { total_rooms: { $regex: search } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  if (total_rooms && total_rooms !== "all") {
    queryObject.total_rooms = total_rooms;
  }
  if (name && name !== null) {
    queryObject.name = name;
  }

  const sortOptions = {
    newest: "-createdAt",
    oldest: "createdAt",
    "a-z": "position",
    "z-a": "-position",
  };

  const sortKey = sortOptions[sort] || sortOptions.newest;

  // setup pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const hotels = await HotelModel.find(queryObject)
    .sort(sortKey)
    .skip(skip)
    .limit(limit);

  const totalHotels = await HotelModel.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalHotels / limit);
  res
    .status(StatusCodes.OK)
    .json({ totalHotels, numOfPages, currentPage: page, hotels });
};

export const getHotel = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  const company = (
    await AdminModel.findOne({
      _id: userId,
    }).populate("company")
  ).company;
  const hotel = await HotelModel.findOne({
    company: company,
    _id: id,
    deleted: false,
  });

  if (!hotel) {
    throw new Error(`no hotel with id : ${hotel} found`);
  }
  res.status(200).json({ hotel });
};

export const editHotel = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  const company = (
    await AdminModel.findOne({
      _id: userId,
    }).populate("company")
  ).company;

  const updatedHotel = await HotelModel.findOneAndUpdate(
    { _id: id, company: company, deleted: false },
    req.body,
    {
      new: true,
    }
  );

  if (!updatedHotel) {
    return res.status(404).json({ msg: `no hotel with id ${id}` });
  }

  res.status(200).json({ updatedHotel: updatedHotel });
};

export const deleteHotel = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  const company = (
    await AdminModel.findOne({
      _id: userId,
    }).populate("company")
  ).company;
  const removedHotel = await HotelModel.findOneAndUpdate(
    { _id: id, company: company },
    { deleted: true },
    {
      new: true,
    }
  );
  if (!removedHotel) {
    return res.status(404).json({ msg: `no hotel with id ${id}` });
  }

  res.status(200).json({ removedHotel: removedHotel });
};

export const showAllBookingAdmin = async (req, res) => {
  const { userId, role } = req.user;

  const fetchedBooking = await BookingModel.aggregate([
    {
      $lookup: {
        from: "hotels", // Name of the hotel model collection
        localField: "hotel",
        foreignField: "_id",
        as: "hotel",
      },
    },
    { $unwind: "$hotel" },
    {
      $lookup: {
        from: "cats", // Name of the hotel model collection
        localField: "cats",
        foreignField: "_id",
        as: "cats",
      },
    },
    // { $unwind: "$cats" },
    {
      $lookup: {
        from: "companies", // Name of the company model collection
        localField: "hotel.company",
        foreignField: "_id",
        as: "hotel.company",
      },
    },
    { $unwind: "$hotel.company" },
    {
      $lookup: {
        from: "admins", // Name of the admin model collection
        localField: "hotel.company._id",
        foreignField: "company",
        as: "admin",
      },
    },
    { $unwind: "$admin" },
    {
      $match: {
        "admin._id": new mongoose.Types.ObjectId(userId), // Match based on the current user's ID
      },
    },
    {
      $project: {
        admin: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        "cats.createdAt": 0,
        "cats.updatedAt": 0,
        "cats.__v": 0,
        "hotel.createdAt": 0,
        "hotel.updatedAt": 0,
        "hotel.__v": 0,
        "hotel.company.createdAt": 0,
        "hotel.company.updatedAt": 0,
        "hotel.company.__v": 0,
      },
    },
  ]);
  res.status(200).json({ fetchedBooking });
};

export const showSingleBookingAdmin = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  const fetchedBooking = await BookingModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "hotels",
        localField: "hotel",
        foreignField: "_id",
        as: "hotel",
      },
    },
    { $unwind: "$hotel" },
    {
      $lookup: {
        from: "cats",
        localField: "cats",
        foreignField: "_id",
        as: "cats",
      },
    },
    { $unwind: "$cats" },
    {
      $lookup: {
        from: "companies",
        localField: "hotel.company",
        foreignField: "_id",
        as: "hotel.company",
      },
    },
    { $unwind: "$hotel.company" },
    {
      $lookup: {
        from: "admins",
        localField: "hotel.company._id",
        foreignField: "company",
        as: "admin",
      },
    },
    { $unwind: "$admin" },
    {
      $match: {
        "admin._id": new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        admin: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        "cats.createdAt": 0,
        "cats.updatedAt": 0,
        "cats.__v": 0,
        "hotel.createdAt": 0,
        "hotel.updatedAt": 0,
        "hotel.__v": 0,
        "hotel.company.createdAt": 0,
        "hotel.company.updatedAt": 0,
        "hotel.company.__v": 0,
      },
    },
  ]);

  res.status(200).json({ fetchedBooking: fetchedBooking });
};

export const cancelAdminBooking = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  let deletedBooking;

  const checkBooking = await BookingModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "hotels", // Name of the hotel model collection
        localField: "hotel",
        foreignField: "_id",
        as: "hotel",
      },
    },
    { $unwind: "$hotel" },
    {
      $lookup: {
        from: "companies",
        localField: "hotel.company",
        foreignField: "_id",
        as: "hotel.company",
      },
    },
    { $unwind: "$hotel.company" },
    {
      $lookup: {
        from: "admins",
        localField: "hotel.company._id",
        foreignField: "company",
        as: "admin",
      },
    },
    { $unwind: "$admin" },
    {
      $match: {
        "admin._id": new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  if (checkBooking.length === 1) {
    deletedBooking = await BookingModel.findOneAndUpdate(
      { _id: id, deleted: false, status: "Approved" },
      { cancelledBy: "admin", status: "Cancelled" },
      { new: true }
    );
  }

  // const company = (await AdminModel.findOne({ _id: userId })).company;

  // const hotel = await HotelModel.find({ company: company });
  // console.log("hotel", hotel);
  // console.log("id", id);
  // const deletedBooking = await BookingModel.findOneAndUpdate(
  //   { hotel: hotel._id, _id: id, deleted: false },
  //   { cancelledBy: "admin", status: "Cancelled" },
  //   { new: true }
  // );
  // console.log("deletedBooking", deletedBooking);
  res.status(200).json(deletedBooking);
};

export const getAdminApplicationStats = async (req, res) => {
  const bookingCount = await BookingModel.countDocuments();
  res.status(200).json({ bookingCount });
};

export const showStats = async (req, res) => {
  const { userId } = req.user;
  let stats = await HotelModel.aggregate([
    {
      $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: "$company" },
    {
      $lookup: {
        from: "admins",
        localField: "company._id",
        foreignField: "company",
        as: "admin",
      },
    },
    { $unwind: "$admin" },
    {
      $match: {
        "admin._id": new mongoose.Types.ObjectId(userId),
      },
    },
    // { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$_id", count: { $sum: 1 } } },
  ]);

  // res.status(StatusCodes.OK).json(stats);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  // console.log(stats);

  const defaultStats = {
    pending: stats._id || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  // let monthlyApplications = await HotelModel.aggregate([
  //   { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } },
  //   {
  //     $group: {
  //       _id: {
  //         year: { $year: "$createdAt" },
  //         month: { $month: "$createdAt" },
  //       },
  //       count: { $sum: 1 },
  //     },
  //   },
  //   { $sort: { "_id.year": -1, "_id.month": -1 } },
  //   { $limit: 6 },
  // ]);
  // monthlyApplications = monthlyApplications
  //   .map((item) => {
  //     const {
  //       _id: { year, month },
  //       count,
  //     } = item;

  //     const date = day()
  //       .month(month - 1)
  //       .year(year)
  //       .format("MMM YY");
  //     return { date, count };
  //   })
  //   .reverse();

  let monthlyApplications = [
    {
      date: "May 23",
      count: 12,
    },
    {
      date: "Jun 23",
      count: 9,
    },
    {
      date: "Jul 23",
      count: 3,
    },
  ];
  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};
