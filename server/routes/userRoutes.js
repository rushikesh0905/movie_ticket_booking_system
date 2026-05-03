import express from "express";
import { getFavorites, getUserBookings, confirmBookingPayment, updateFavorite } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

// ✅ Protected routes
userRouter.get('/bookings', protectRoute, getUserBookings);
userRouter.get('/bookings/confirm', protectRoute, confirmBookingPayment);

// ✅ Public routes
userRouter.post('/update-favorite', updateFavorite);
userRouter.get('/favorites', getFavorites);

export default userRouter;