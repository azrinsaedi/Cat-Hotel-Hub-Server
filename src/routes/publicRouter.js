import { Router } from "express";
import { bookHotel, viewHotels } from "../controllers/publicController.js";
const router = Router();

router.route("/hotels").get(viewHotels); // later add middleware for IP address check location
router.route("/booking/:id").get(bookHotel);

export default router;
