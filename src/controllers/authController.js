import { StatusCodes } from "http-status-codes";
import Customer from "../models/AccountsModel.js";
import { UnauthenticatedError } from "../errors/customErrors.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT } from "../utils/tokenUtils.js";

export const register = async (req, res) => {
  // first registered user is an admin
  const isFirstAccount = (await Customer.countDocuments()) === 0;
  req.body.role = isFirstAccount ? "admin" : "user";

  const hashedPassword = await hashPassword(req.body.password);
  req.body.password = hashedPassword;

  const customer = await Customer.create(req.body);
  res.status(StatusCodes.CREATED).json({ customer });
};
export const login = async (req, res) => {
  const customer = await Customer.findOne({ email: req.body.email });
  const password = req.body.password;
  const token = createJWT({ userId: customer._id, role: customer.role });
  console.log(token);
  const isValidCustomer =
    customer && (await comparePassword(password, customer.password));
  if (!isValidCustomer) throw new UnauthenticatedError("invalid credentials");
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    // secure: process.env.NODE_ENV === "production",
    secure: false,
  });

  res.status(StatusCodes.CREATED).json({ msg: "user logged in" });
  // res.send("login route");
};

export const logout = (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};
