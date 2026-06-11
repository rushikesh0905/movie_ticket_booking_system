import mongoose from "mongoose";

const connectDB = async () => {
    try {

        mongoose.connection.on("connected", () => {
            console.log("✅ Database Connected");
        });

        mongoose.connection.on("error", (error) => {
            console.error("❌ MongoDB Error:", error.message);
        });

        const mongoUrl = process.env.MONGODB_URL?.trim();

        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not set in environment variables");
        }

        await mongoose.connect(mongoUrl, {
            dbName: "quickshow",
        });

        console.log("🚀 MongoDB Atlas Connected Successfully");

    } catch (error) {

        console.error("❌ Database Connection Failed:");
        console.error(error.message);

        process.exit(1);
    }
};

export default connectDB;