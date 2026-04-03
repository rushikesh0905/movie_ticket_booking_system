import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        _id: { type: String },  // ✅ Clerk userId as _id
        email: { type: String, required: true },
        name: { type: String },
        image: { type: String },
    },
    { _id: false } // ✅ tells mongoose not to auto-generate _id
);

export default mongoose.model("User", userSchema);