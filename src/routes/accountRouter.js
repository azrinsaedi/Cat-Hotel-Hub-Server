import { Router } from "express";
const router = Router();

import {
  registerAccount,
  loginAccount,
  logoutAccount,
  forgotPasswordAccount,
  executeForgotPasswordAccount,
  changePasswordAccount,
  updateAccount,
  addPet,
  showAllBookings,
  showSingleBookings,
  cancelCustomerBooking,
  showAllPets,
  addBooking,
  editPet,
  deletePet,
  getCurrentUser,
  getApplicationStats,
  getSinglePet,
  getCurrentUserDetails,
} from "../controllers/accountController.js";

import {
  authenticateAccount,
  authorizePermissions,
} from "../middleware/authMiddleware.js";

router.route("/register").post(registerAccount); //later add validation input
router.route("/login").post(loginAccount); //later add validation input
router.route("/logout").get(logoutAccount);
router.route("/forgot-password").get(forgotPasswordAccount);
router.route("/forgot-password/:id/:token").get(executeForgotPasswordAccount);
router.route("/forgot-password/change-password").post(changePasswordAccount);
router.patch("/update-account", authenticateAccount, updateAccount);
router.route("/add-pet").post(authenticateAccount, addPet);
router.route("/pet/:id").get(authenticateAccount, getSinglePet);
router.route("/edit-pet/:id").patch(authenticateAccount, editPet);
router.route("/delete-pet/:id").delete(authenticateAccount, deletePet);
router.route("/show-pets").get(authenticateAccount, showAllPets);
router.route("/add-booking").post(authenticateAccount, addBooking);
router.route("/show-bookings").get(authenticateAccount, showAllBookings);
router.route("/show-booking/:id").get(authenticateAccount, showSingleBookings);
router
  .route("/cancel-booking/:id")
  .delete(authenticateAccount, cancelCustomerBooking);

router.get("/current-user", authenticateAccount, getCurrentUser);
router.get("/current-user-details", authenticateAccount, getCurrentUserDetails);
router.get(
  "/admin/app-stats",
  authorizePermissions("admin"),
  getApplicationStats
);

export default router;
