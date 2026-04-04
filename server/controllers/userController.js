import { clerkClient } from "@clerk/express";
import Stripe from "stripe";
import Booking from "../models/Booking.js";   
import Movie from "../models/Movie.js";        
import sendEmail from "../configs/nodeMailer.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// ✅ Fix 1: "requestAnimationFrame" renamed to "req"
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.auth().userId;  

        if (!userId) {
            return res.json({
                success: false,
                message: "User not authenticated"
            });
        }

        const bookings = await Booking.find({ user: userId })
        .populate({
            path: "show",
            populate: { path: 'movie' }
        })
        .sort({ createdAt: -1 });

        res.json({ success: true, bookings });

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const confirmBookingPayment = async (req, res) => {
  try {
    const userId = req.auth().userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Missing session_id' });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

    if (!stripeSession || stripeSession.payment_status !== 'paid') {
      return res.status(200).json({ success: false, message: 'Payment not completed yet' });
    }

    const booking = await Booking.findOne({ stripeSessionId: session_id, user: userId })
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" }
      });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found for this session' });
    }

    if (!booking.isPaid) {
      booking.isPaid = true;
      booking.paymentLink = '';
      await booking.save();

      // Send confirmation email
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
        const userName = clerkUser.firstName || clerkUser.lastName || "User";

        if (isValidEmail(userEmail)) {
          await sendEmail({
            to: userEmail,
            subject: `Payment confirmation: "${booking.show.movie.title}" booked!`,
            body: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
    <!-- Header with Logo -->
    <div style="text-align: center; background-color: #1a1a1a; padding: 20px; border-radius: 10px 10px 0 0;">
      <img src="https://via.placeholder.com/150x50/ffffff/000000?text=QuickShow" alt="QuickShow Logo" style="max-width: 150px; height: auto;">
      <h1 style="color: #fff; margin: 10px 0 0 0; font-size: 24px;">Booking Confirmed!</h1>
    </div>

    <!-- Ticket -->
    <div style="background-color: #fff; border: 2px solid #1a1a1a; border-radius: 0 0 10px 10px; padding: 30px; position: relative;">
      <!-- Ticket perforation effect -->
      <div style="position: absolute; top: 50%; left: -10px; width: 20px; height: 20px; background-color: #f4f4f4; border-radius: 50%; transform: translateY(-50%);"></div>
      <div style="position: absolute; top: 50%; right: -10px; width: 20px; height: 20px; background-color: #f4f4f4; border-radius: 50%; transform: translateY(-50%);"></div>

      <h2 style="text-align: center; color: #1a1a1a; margin-bottom: 20px;">Your Movie Ticket</h2>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1;">
          <h3 style="color: #333; margin: 0 0 10px 0;">${booking.show.movie.title}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-IN")}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-IN")}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Seats:</strong> ${booking.seats.join(", ")}</p>
        </div>
        <div style="flex: 1; text-align: right;">
          <p style="margin: 5px 0; color: #666;"><strong>Booking ID:</strong> ${booking._id.toString().slice(-8).toUpperCase()}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Customer:</strong> ${userName}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Amount Paid:</strong> ₹${booking.amount}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc;">
        <p style="color: #666; font-size: 14px;">Please show this ticket at the theater entrance</p>
        <p style="color: #666; font-size: 12px;">Powered by QuickShow</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
      <p>Thank you for choosing QuickShow! Enjoy your movie experience.</p>
      <p>If you have any questions, contact us at support@quickshow.com</p>
    </div>
  </div>
  `,
          });
          console.log("📧 Confirmation email sent to", userEmail);
        } else {
          console.error("❌ Invalid user email for notification", userEmail);
        }
      } catch (emailErr) {
        console.error("❌ Email send failed:", emailErr);
      }
    }

    return res.json({ success: true, message: 'Booking marked as paid' });
  } catch (error) {
    console.error('confirmBookingPayment ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId)

        if (!user.privateMetadata.favorites) {
            user.privateMetadata.favorites = []
        }
        if (!user.privateMetadata.favorites.includes(movieId)) {
            user.privateMetadata.favorites.push(movieId)
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
                item => item !== movieId
            )
        }
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: user.privateMetadata
        })

        res.json({ success: true, message: "Favorite updated successfully" })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getFavorites = async (req, res) => {
    try {
        
        const user = await clerkClient.users.getUser(req.auth().userId)
        const favorites = user.privateMetadata.favorites || [];  // ✅ Fix 6: handle undefined

        const movies = await Movie.find({ _id: { $in: favorites } })

        
        res.json({ success: true, movies })
    } catch (error) {
       
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}