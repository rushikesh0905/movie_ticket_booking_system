import { clerkClient } from "@clerk/express";

const ADMIN_EMAIL = "rrushikeshargade@gmail.com"; // 🔥 PUT YOUR EMAIL HERE

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.json({ success: false, message: "Not logged in" });
        }

        const user = await clerkClient.users.getUser(userId);

        const email = user.emailAddresses[0]?.emailAddress;

        if (email !== ADMIN_EMAIL) {
            return res.json({
                success: false,
                message: "Not authorized",
            });
        }

        next();

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};
export const protectRoute = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        
        if (!userId) {
            return res.json({ 
                success: false, 
                message: "Not logged in" 
            });
        }
        next();
        
    } catch (error) {
        console.error("protectRoute error:", error.message);
        return res.json({ 
            success: false, 
            message: error.message || "Server error"
        });
    }
}