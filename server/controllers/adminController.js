import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import { clerkClient } from "@clerk/express";

export const isAdmin = async (req, res) => {
    try {
        const userId = req.auth().userId;

        if (!userId) {
            return res.json({ success: false, isAdmin: false, message: "Not logged in" });
        }

        const user = await clerkClient.users.getUser(userId);
        const adminStatus = user.privateMetadata?.role === "admin";

        console.log("userId:", userId);
        console.log("privateMetadata:", user.privateMetadata);
        console.log("isAdmin:", adminStatus);

        res.json({ success: true, isAdmin: adminStatus });

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, isAdmin: false, message: error.message });
    }
};

export const getDashboardData = async (req, res) => {
    try {
        // ✅ Run all queries in parallel for better performance
        const [bookings, activeShows, totalUsers] = await Promise.all([
            Booking.find({ isPaid: true }),
            Show.find({ showDateTime: { $gte: new Date() } }).populate('movie'),
            User.countDocuments()
        ]);

        const dashboardData = {
            totalBooking: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + (booking.amount || 0), 0),
            activeShows,
            totalUsers
        };

        console.log("Dashboard data:", dashboardData); // 👈 check server terminal

        res.json({ success: true, dashboardData });

    } catch (error) {
        console.error("getDashboardData error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({
            showDateTime: { $gte: new Date() }
        }).populate('movie').sort({ showDateTime: 1 });
        res.json({ success: true, shows });

    } catch (error) {
        console.error("getAllShows error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 });
        res.json({ success: true, bookings });

    } catch (error) {
        console.error("getAllBookings error:", error.message);
        res.json({ success: false, message: error.message });
    }
};