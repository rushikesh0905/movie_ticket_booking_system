import express from "express";
import { register, login, forgotPassword, resetPassword, getUserInfo, logout } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.js";

const authRouter = express.Router();

// ✅ Public Routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);

// ✅ Protected Routes
authRouter.get('/me', protectRoute, getUserInfo);
authRouter.post('/logout', protectRoute, logout);

export default authRouter;
