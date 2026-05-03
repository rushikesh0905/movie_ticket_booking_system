import express from "express";
import { createBooking, getOccupiedSeats, refreshBookingPayment } from "../controllers/bookingController.js";
import { protectRoute } from "../middleware/auth.js";

const bookingRouter = express.Router();

// ✅ CREATE BOOKING (protected)
bookingRouter.post('/create', protectRoute, createBooking);

// ✅ REFRESH/RECREATE payment session for existing unpaid booking
bookingRouter.post('/refresh', protectRoute, refreshBookingPayment);

// ✅ GET OCCUPIED SEATS (FIXED METHOD)
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;