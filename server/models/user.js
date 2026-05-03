import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        name: { type: String, required: true },
        password: { type: String, required: true }, // ✅ Hashed password
        image: { type: String },
        favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Show' }], // ✅ Array of favorite show IDs
        isEmailVerified: { type: Boolean, default: false },
        resetPasswordToken: { type: String, default: null },
        resetPasswordOTP: { type: String, default: null },
        resetPasswordOTPExpires: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
    }
);

export default mongoose.model("User", userSchema);