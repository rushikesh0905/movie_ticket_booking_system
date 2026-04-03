import express from "express";
import { requireAuth } from "@clerk/express";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// ✅ CREATE BOOKING (protected)
bookingRouter.post('/create', requireAuth(), createBooking);

// ✅ GET OCCUPIED SEATS (FIXED METHOD)
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;