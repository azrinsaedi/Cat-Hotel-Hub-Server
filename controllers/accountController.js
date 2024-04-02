import { nanoid } from "nanoid";
import { StatusCodes } from "http-status-codes";
import { UnauthenticatedError } from "../errors/customErrors.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT, verifyJWT } from "../utils/tokenUtils.js";
import { createCookie, removeCookie } from "../utils/cookieUtils.js";
import nodemailer from "nodemailer";
import BookingModel from "../models/BookingModel.js";
import CatsModel from "../models/CatsModel.js";
import CustomersModel from "../models/AccountsModel.js";
import AccountsModel from "../models/AccountsModel.js";

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
  const tokenData = createJWT({ userId: account._id });

  const isValidAccount =
    account && (await comparePassword(password, account.password));
  if (!isValidAccount) throw new UnauthenticatedError("invalid credentials");

  createCookie({ tokenName: "tokenAccount", tokenData, res });

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
  const { userId } = req.user;
  const { name } = req.body;
  const cat = await CatsModel.create({ customer: userId, name: name });
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
  const { userId } = req.user;
  const pets = await CatsModel.find({ customer: userId });
  res.status(200).json({ pets });
};

export const addBooking = async (req, res) => {
  const { userId } = req.user;
  const { hotel, check_in, check_out, cats, occupied_rooms } = req.body;
  const booking = await BookingModel.create({
    customer: userId,
    hotel,
    check_in,
    check_out,
    cats,
    occupied_rooms,
  });
  res.send(booking);
};

export const showAllBookings = async (req, res) => {
  const { userId } = req.user;
  const bookings = await BookingModel.find({ customer: userId });
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
    { cancelledBy: "customer" },
    { new: true }
  );
  res.status(200).json(deletedBooking);
};
export const getCurrentUser = async (req, res) => {
  const customer = await CustomersModel.findOne({ _id: req.user.userId });
  const userWithoutPassword = customer.toJSON();
  res.status(StatusCodes.OK).json({ customer: userWithoutPassword });
};

export const getApplicationStats = async (req, res) => {
  const users = await CustomersModel.countDocuments();
  const cats = await CatsModel.countDocuments();
  res.status(StatusCodes.OK).json({ users, cats });
};
