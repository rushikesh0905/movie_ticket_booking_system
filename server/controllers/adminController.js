import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import { clerkClient } from "@clerk/express";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rrushikeshargade@gmail.com";

export const isAdmin = async (req, res) => {
    try {
        const userId = req.auth().userId;

        if (!userId) {
            return res.json({ success: false, isAdmin: false, message: "Not logged in" });
        }

        const user = await clerkClient.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;
        const adminStatus = email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        console.log("userId:", userId);
        console.log("email:", email);
        console.log("isAdmin:", adminStatus);

        res.json({ success: true, isAdmin: adminStatus });

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, isAdmin: false, message: error.message });
    }
};

export const getDashboardData = async (req, res) => {
    try {
        const now = new Date();

        // use counts and aggregations instead of fetching full collection
        const totalBooking = await Booking.countDocuments({ isPaid: true });

        const revenueResult = await Booking.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;

        const activeShows = await Show.find({ showDateTime: { $gte: now } })
            .populate('movie')
            .sort({ showDateTime: 1 })
            .limit(10);

        const totalUsers = await User.countDocuments();

        const dashboardData = {
            totalBooking,
            totalRevenue,
            activeShows,
            totalUsers
        };

        console.log("Dashboard data:", dashboardData);

        res.json({ success: true, dashboardData });

    } catch (error) {
        console.error("getDashboardData error:", error.message);
        res.status(500).json({ success: false, message: error.message });
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
        const page = parseInt(req.query.page || '1');
        const limit = Math.min(parseInt(req.query.limit || '20'), 50);
        const skip = (Math.max(page, 1) - 1) * limit;

        const [totalBookings, bookings] = await Promise.all([
            Booking.countDocuments(),
            Booking.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "show",
                    populate: { path: "movie" }
                })
                .lean()
        ]);

        const bookingsWithUserData = await Promise.all(
            bookings.map(async (booking) => {
                try {
                    const clerkUser = await clerkClient.users.getUser(booking.user);
                    return {
                        ...booking,
                        user: {
                            id: booking.user,
                            name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : clerkUser.emailAddresses[0]?.emailAddress || 'Unknown'
                        }
                    };
                } catch (err) {
                    console.error("User fetch error:", err);
                    return {
                        ...booking,
                        user: {
                            id: booking.user,
                            name: 'Unknown User'
                        }
                    };
                }
            })
        );

        res.json({ success: true, bookings: bookingsWithUserData, totalBookings, page, limit });

    } catch (error) {
        console.error("getAllBookings error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};