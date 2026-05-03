import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/user.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rrushikeshargade@gmail.com";

export const isAdmin = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.json({ success: false, isAdmin: false, message: "Not logged in" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, isAdmin: false, message: "User not found" });
        }

        const adminStatus = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        console.log("userId:", userId);
        console.log("email:", user.email);
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

export const getBookingNotifications = async (req, res) => {
    try {
        const recentBookings = await Booking.find({ isPaid: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({
                path: 'show',
                populate: { path: 'movie' }
            })
            .lean();

        const notifications = await Promise.all(
            recentBookings.map(async (booking) => {
                let userName = 'Unknown User';

                try {
                    const user = await User.findById(booking.user);
                    userName = user?.name || user?.email || 'Unknown User';
                } catch (err) {
                    console.error("Notification user fetch error:", err.message);
                }

                return {
                    id: booking._id.toString(),
                    userName,
                    showTitle: booking.show?.movie?.title || 'Unknown show',
                    seats: booking.seats.join(', '),
                    amount: booking.amount,
                    createdAt: booking.createdAt,
                };
            })
        );

        res.json({ success: true, notifications });
    } catch (error) {
        console.error("getBookingNotifications error:", error.message);
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
                    const user = await User.findById(booking.user);
                    return {
                        ...booking,
                        user: {
                            id: booking.user,
                            name: user?.name || user?.email || 'Unknown'
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