import express from "express";
import { requireAuth } from "@clerk/express";
import { getFavorites, getUserBookings, updateFavorite } from "../controllers/userController.js";

const userRouter = express.Router();

// ✅ FIX: protect this route
userRouter.get('/bookings', requireAuth(), getUserBookings);

userRouter.post('/update-favorite', updateFavorite);
userRouter.get('/favorites', getFavorites);

export default userRouter;