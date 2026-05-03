import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../configs/nodeMailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-env";
const JWT_EXPIRE = "7d";

// ✅ Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// ✅ Generate OTP (6 digits)
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ REGISTER
export const register = async (req, res) => {
    try {
        const { email, name, password, confirmPassword } = req.body;

        // Validation
        if (!email || !name || !password || !confirmPassword) {
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (password.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            email: email.toLowerCase(),
            name,
            password: hashedPassword,
            isEmailVerified: true // Set to true directly (no email verification needed for now)
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id.toString());

        // Send welcome email
        try {
            await sendEmail({
                to: newUser.email,
                subject: "Welcome to QuickShow! 🎬",
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Welcome to QuickShow, ${name}!</h2>
                        <p>Your account has been created successfully.</p>
                        <p>You can now login and start booking your favorite movies.</p>
                        <p>Enjoy! 🎉</p>
                    </div>
                `
            });
        } catch (error) {
            console.log("Welcome email failed:", error.message);
        }

        res.json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                _id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                image: newUser.image
            }
        });

    } catch (error) {
        console.error("Register error:", error.message);
        res.json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

// ✅ LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id.toString());

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                image: user.image
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

// ✅ FORGOT PASSWORD (Send OTP)
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                success: false,
                message: "No account found with this email"
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = otpExpires;
        await user.save();

        // Send OTP email
        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset OTP - QuickShow 🔐",
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Reset Request</h2>
                        <p>You requested to reset your password. Here's your OTP:</p>
                        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                            <h1 style="letter-spacing: 5px; color: #333;">${otp}</h1>
                        </div>
                        <p><strong>This OTP will expire in 10 minutes.</strong></p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            });
        } catch (error) {
            console.log("OTP email failed:", error.message);
        }

        res.json({
            success: true,
            message: "OTP sent to your email"
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);
        res.json({
            success: false,
            message: error.message || "Failed to process request"
        });
    }
};

// ✅ VERIFY OTP & RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // Verify OTP
        if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Check OTP expiration
        if (new Date() > user.resetPasswordOTPExpires) {
            user.resetPasswordOTP = null;
            user.resetPasswordOTPExpires = null;
            await user.save();

            return res.json({
                success: false,
                message: "OTP has expired. Please request a new one"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpires = null;
        await user.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: user.email,
                subject: "Password Updated - QuickShow ✅",
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Updated Successfully</h2>
                        <p>Your QuickShow password has been reset successfully.</p>
                        <p>You can now login with your new password.</p>
                        <p>If you didn't make this change, please contact support immediately.</p>
                    </div>
                `
            });
        } catch (error) {
            console.log("Confirmation email failed:", error.message);
        }

        res.json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error.message);
        res.json({
            success: false,
            message: error.message || "Password reset failed"
        });
    }
};

// ✅ GET USER INFO (Protected Route)
export const getUserInfo = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get user error:", error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// ✅ LOGOUT (Frontend will handle token removal)
export const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};
