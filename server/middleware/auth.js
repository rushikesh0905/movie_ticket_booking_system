import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.json({ 
                success: false, 
                message: "Not logged in" 
            });
        }

        const user = await clerkClient.users.getUser(userId);
        console.log("privateMetadata:", user.privateMetadata);

        if (user.privateMetadata?.role !== 'admin') {
            return res.json({ 
                success: false, 
                isAdmin: false,
                message: "Not authorized" 
            });
        }

        next();

    } catch (error) {
        console.error("protectAdmin error:", error.message); // ✅ only log message
        return res.json({ 
            success: false, 
            message: error.message || "Not authorized"  // ✅ fixed
        });
    }
}

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