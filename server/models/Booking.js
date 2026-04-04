import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true },

  show: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Show", 
    required: true 
  },

  amount: { type: Number, required: true },

  seats: { 
    type: [String], // ✅ FIXED TYPE
    required: true 
  },

  isPaid: { type: Boolean, default: false },

  paymentLink: { type: String },

  stripeSessionId: { type: String }

}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;