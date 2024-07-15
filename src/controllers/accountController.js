import { nanoid } from "nanoid";
import { StatusCodes } from "http-status-codes";
import { UnauthenticatedError } from "../errors/customErrors.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT, verifyJWT } from "../utils/tokenUtils.js";
import { createCookie, removeCookie } from "../utils/cookieUtils.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import BookingModel from "../models/BookingModel.js";
import CatsModel from "../models/CatsModel.js";
import CustomersModel from "../models/AccountsModel.js";
import AccountsModel from "../models/AccountsModel.js";
import cloudinary from "cloudinary";
import { formatImage } from "../middleware/multerMiddleware.js";

import stripe from "stripe";
import RatingModel from "../models/RatingModel.js";

export const registerAccount = async (req, res) => {
  const hashedPassword = await hashPassword(req.body.password);
  req.body.password = hashedPassword;
  const { username, name, email, password, lastname, location } = req.body;

  if (await AccountsModel.findOne({ username: username })) {
    res.send("Username already used");
    return;
  }

  if (await AccountsModel.findOne({ email: email })) {
    res.send("Email already used");
    return;
  }

  const account = await AccountsModel.create({
    username,
    name,
    email,
    password,
    lastname,
    location,
  });
  res.send(account);
};

export const loginAccount = async (req, res) => {
  const account = await AccountsModel.findOne({ email: req.body.email });
  const password = req.body.password;
  let rememberMe = "off";
  if (req.body.remember) {
    rememberMe = req.body.remember;
  }

  const tokenData = createJWT({ userId: account._id });

  const isValidAccount =
    account && (await comparePassword(password, account.password));
  if (!isValidAccount) throw new UnauthenticatedError("invalid credentials");

  createCookie({
    tokenName: "tokenAccount",
    tokenData,
    rememberMe: rememberMe,
    res,
  });

  res.status(StatusCodes.CREATED).json({ msg: "account logged in" });
};

export const logoutAccount = async (req, res) => {
  removeCookie({ tokenName: "tokenAccount", tokenData: "loggedAccount", res });

  res.status(StatusCodes.OK).json({ msg: "account logged out!" });
};

export const forgotPasswordAccount = async (req, res) => {
  //check email format in middleware
  const email = req.body.email;

  const code = nanoid(10);

  const updatedForgotPassword = await AccountsModel.findOneAndUpdate(
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
    text: `http://localhost:5100/account/forgot-password/${updatedForgotPassword._id}/${code}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.status(StatusCodes.OK).json({
    msg: `http://localhost:5100/account/forgot-password/${updatedForgotPassword._id}/${code}`,
  });
};

export const executeForgotPasswordAccount = async (req, res) => {
  const { id, token } = req.params;
  const email = (
    await AccountsModel.findOne({ _id: id, forgotPassword: token })
  )?.email;
  if (email === undefined) {
    res.send("Token is wrong");
    return;
  }
  console.log(id, token, email);
  res.send(`Account ID is ${id} and code ${token} and email ${email}`);
};

export const changePasswordAccount = async (req, res) => {
  //middleware to check password and confirm password
  const { id, token } = req.body;

  const hashedPassword = await hashPassword(req.body.password);

  const updatedAccountPassword = await AccountsModel.findOneAndUpdate(
    { _id: id, forgotPassword: token },
    { password: hashedPassword, forgotPassword: null }
  );
  res.send(`Account updated ${updatedAccountPassword}`);
};

export const updateAccount = async (req, res) => {
  const { userId } = req.user;
  const {
    username,
    name,
    email,
    password,
    phone,
    lastName,
    location,
    avatar,
    avatarPublicId,
  } = req.body;

  const updatedAccount = await CustomersModel.findByIdAndUpdate(userId, {
    username,
    name,
    email,
    password,
    phone,
    lastName,
    location,
    avatar,
    avatarPublicId,
  });
  res.status(StatusCodes.OK).json(updatedAccount);
};

export const addPet = async (req, res) => {
  const newCat = { ...req.body };

  const { userId } = req.user;

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
      newCat.images = uploadedImages;
    } catch (error) {
      console.error("Error uploading images:", error);
      return res.status(500).json({ msg: "Error uploading images" });
    }
  }
  const { name, microchip, images, type } = newCat;
  console.log("newCat", newCat);
  const cat = await CatsModel.create({
    customer: userId,
    name: name,
    microchip,
    images,
    type,
  });
  res.send(cat);
};

export const editPet = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name } = req.body;
  const fetchedCat = await CatsModel.findOne({ customer: userId, _id: id });
  if (!fetchedCat) {
    res.send("No cat with that id to the user");
    return;
  }
  const updatedPet = await CatsModel.findOneAndUpdate(
    { customer: userId, _id: id },
    { name },
    { new: true }
  );
  res.send(updatedPet);
};

export const getSinglePet = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const fetchedCat = await CatsModel.findOne({ customer: userId, _id: id });
  if (!fetchedCat) {
    res.send("No cat with that id to the user");
    return;
  }
  res.send(fetchedCat);
};

export const deletePet = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const deletedPet = await CatsModel.findOneAndUpdate(
    { customer: userId, _id: id },
    { deleted: true },
    { new: true }
  );
  res.send(deletedPet);
};

export const showAllPets = async (req, res) => {
  const { search, name, sort } = req.query;
  const { userId } = req.user;

  const queryObject = {
    customer: userId,
    deleted: false,
  };
  if (search) {
    queryObject.$or = [{ name: { $regex: search, $options: "i" } }];
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

  const cats = await CatsModel.find(queryObject)
    .sort(sortKey)
    .skip(skip)
    .limit(limit);

  const totalCats = await CatsModel.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalCats / limit);
  res
    .status(StatusCodes.OK)
    .json({ totalCats, numOfPages, currentPage: page, cats });

  // const { userId } = req.user;
  // const pets = await CatsModel.find({ customer: userId });
  // res.status(200).json({ pets });
};

export const addBooking = async (req, res) => {
  try {
    const { userId } = req.user;

    const {
      hotel,
      check_in,
      check_out,
      cats,
      occupied_rooms,
      status,
      currency,
      price_in_cents,
    } = req.body;

    let { extraServices } = req.body;

    // Handle extraServices being null or an empty string
    if (extraServices && extraServices.trim() !== "") {
      extraServices = extraServices.split(",").map((service) => service.trim());
    } else {
      extraServices = [];
    }

    console.log("cats", cats);
    console.log("extraServices", extraServices);

    // Payment Intent
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: price_in_cents,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(paymentIntent);

    let booking = await BookingModel.create({
      customer: userId,
      hotel,
      check_in,
      check_out,
      currency,
      cats: cats.split(",").map((cat) => cat.trim()),
      status,
      extraServices,
      occupied_rooms,
      payment_ID: paymentIntent.id,
      price_in_cents,
    });

    booking = await booking.populate("hotel");
    res.send({ booking, paymentIntent });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .send({ error: "An error occurred while creating the booking" });
  }
};

export const updateBookingSuccess = async (req, res) => {
  const { userId } = req.user;
  const { payment_ID } = req.body;

  try {
    let booking = await BookingModel.findOneAndUpdate(
      {
        customer: new mongoose.Types.ObjectId(userId),
        payment_ID: payment_ID,
      },
      { status: "Approved" },
      { new: true }
    );
    booking = await booking.populate("hotel");
    res.send({ booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export const showAllBookings = async (req, res) => {
  const { userId } = req.user;
  const bookings = await BookingModel.find({ customer: userId })
    .populate("hotel")
    .populate("cats");
  res.status(200).json({ bookings });
};

export const showSingleBookings = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const booking = await BookingModel.findOne({ customer: userId, _id: id });
  res.status(200).json(booking);
};
export const cancelCustomerBooking = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const deletedBooking = await BookingModel.findOneAndUpdate(
    { customer: userId, _id: id, deleted: false },
    { cancelledBy: "customer", status: "Cancelled" },
    { new: true }
  );
  res.status(200).json(deletedBooking);
};
export const getCurrentUser = async (req, res) => {
  const customer = await CustomersModel.findOne({ _id: req.user.userId });
  const userWithoutPassword = customer.toJSON();
  res.status(StatusCodes.OK).json({ customer: userWithoutPassword });
};

export const getCurrentUserFetch = async (req, res) => {
  const { tokenAccount } = req.cookies;

  if (!tokenAccount || tokenAccount === undefined) {
    res.send("");
    return;
  }

  try {
    const { userId } = verifyJWT(tokenAccount);
    req.user = { userId };
    const customer = await CustomersModel.findOne({ _id: req.user.userId });
    res.send(customer);
  } catch (error) {
    res.send("");
  }

  // const customer = await CustomersModel.findOne({ _id: req.user.userId });
  // const userWithoutPassword = customer.toJSON();
  // res.status(StatusCodes.OK).json({ customer: userWithoutPassword });
};

export const getCurrentUserDetails = async (req, res) => {
  const customer = await CustomersModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user.userId), // Match based on the current user's ID
      },
    },
    {
      $lookup: {
        from: "cats", //name of other model
        localField: "_id",
        foreignField: "customer",
        as: "cats",
      },
    },
  ]);
  res.status(StatusCodes.OK).json(customer);
};

export const postAddWishlist = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    // Check if the id already exists in the wishlist array
    const user = await AccountsModel.findOne({ _id: userId });
    if (user.wishlist.includes(id)) {
      return res.status(StatusCodes.OK).json(user);
    }

    // Append id to the wishlist array
    const updatedWishlist = await AccountsModel.findOneAndUpdate(
      { _id: userId },
      { $push: { wishlist: id } },
      { new: true }
    );

    console.log(id);
    res.status(StatusCodes.OK).json(updatedWishlist);
  } catch (error) {
    console.error("Error adding item to wishlist:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

export const postComment = async (req, res) => {
  const { id } = req.params;
  const { rating, comment, title } = req.body;
  const { userId } = req.user;
  await RatingModel.create({
    hotel: id,
    rating,
    title,
    comment,
    customer: userId,
  });
  res.status(StatusCodes.OK).json({ id, rating, comment });
};

export const getApplicationStats = async (req, res) => {
  const users = await CustomersModel.countDocuments();
  const cats = await CatsModel.countDocuments();
  res.status(StatusCodes.OK).json({ users, cats });
};
