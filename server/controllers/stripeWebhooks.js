import Stripe from "stripe";
import Booking from "../models/Booking.js";
import sendEmail from "../configs/nodeMailer.js";
import { clerkClient } from "@clerk/express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    console.log(`ℹ️ Ignoring event type ${event.type}`);
    return res.json({ received: true });
  }

  try {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error("❌ Stripe session missing bookingId metadata");
      return res.status(400).send("Missing bookingId");
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "show",
      populate: { path: "movie", model: "Movie" },
    });

    if (!booking) {
      console.error("❌ Booking not found for id", bookingId);
      return res.json({ received: true });
    }

    if (booking.isPaid) {
      console.log("⚠️ Booking already marked paid", bookingId);
      return res.json({ received: true });
    }

    booking.isPaid = true;
    booking.paymentLink = "";
    await booking.save();

    let userEmail;
    let userName = "User";

    try {
      const clerkUser = await clerkClient.users.getUser(booking.user);
      userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      userName = clerkUser.firstName || clerkUser.lastName || "User";
    } catch (clerkErr) {
      console.error("❌ Clerk user fetch failed for booking.user", booking.user, clerkErr.message);
    }

    if (!isValidEmail(userEmail)) {
      console.error("❌ Invalid user email for notification", userEmail);
      return res.json({ received: true });
    }

    try {
      await sendEmail({
        to: userEmail,
        subject: `Payment confirmation: "${booking.show.movie.title}" booked!`,
        body: `
  <div style="font-family: Arial, sans-serif;">
    <h2>Hi ${userName},</h2>

    <p>Your booking for <strong>${booking.show.movie.title}</strong> is confirmed 🎉</p>

    <p>
      <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-IN")}<br/>
      <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-IN")}
    </p>

    <p>Seats: ${booking.seats.join(", ")}</p>

    <p>Enjoy your movie 🍿</p>
  </div>
  `,
      });
      console.log("📧 Email sent to", userEmail);
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return res.status(500).send("Webhook failed");
  }
};

