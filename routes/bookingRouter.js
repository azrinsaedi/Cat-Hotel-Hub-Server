import { Router } from "express";
const router = Router();

import {
  createBooking,
  deleteBooking,
} from "../controllers/bookingController.js";

router.route("/").post(createBooking);
router.route("/:id").delete(deleteBooking);

export default router;
