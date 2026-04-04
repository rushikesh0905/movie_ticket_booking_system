import express from "express";
import { requireAuth } from "@clerk/express";
import { createBooking, getOccupiedSeats, refreshBookingPayment } from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// ✅ CREATE BOOKING (protected)
bookingRouter.post('/create', requireAuth(), createBooking);

// ✅ REFRESH/RECREATE payment session for existing unpaid booking
bookingRouter.post('/refresh', requireAuth(), refreshBookingPayment);

// ✅ GET OCCUPIED SEATS (FIXED METHOD)
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;