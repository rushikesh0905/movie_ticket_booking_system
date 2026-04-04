import express from "express";
import { requireAuth } from "@clerk/express";
import { getFavorites, getUserBookings, confirmBookingPayment, updateFavorite } from "../controllers/userController.js";

const userRouter = express.Router();

// ✅ FIX: protect these routes
userRouter.get('/bookings', requireAuth(), getUserBookings);
userRouter.get('/bookings/confirm', requireAuth(), confirmBookingPayment);

userRouter.post('/update-favorite', updateFavorite);
userRouter.get('/favorites', getFavorites);

export default userRouter;