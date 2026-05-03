import jwt from "jsonwebtoken";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-env";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rrushikeshargade@gmail.com";

// ✅ Extract token from Authorization header
const getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.slice(7); // Remove "Bearer " prefix
};

// ✅ PROTECT ROUTE - Verify JWT
export const protectRoute = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);

        if (!token) {
            return res.json({
                success: false,
                message: "Not logged in"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;

        next();

    } catch (error) {
        console.error("protectRoute error:", error.message);
        return res.json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// ✅ PROTECT ADMIN - Verify JWT + Admin Status
export const protectAdmin = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);

        if (!token) {
            return res.json({
                success: false,
                message: "Not logged in"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return res.json({
                success: false,
                message: "Not authorized"
            });
        }

        req.userId = userId;
        next();

    } catch (error) {
        console.error("protectAdmin error:", error.message);
        return res.json({
            success: false,
            message: error.message || "Unauthorized"
        });
    }
};