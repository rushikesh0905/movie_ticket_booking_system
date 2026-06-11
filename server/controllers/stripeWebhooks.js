import Stripe from "stripe";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import sendEmail from "../configs/nodeMailer.js";

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
      populate: {
        path: "movie",
        model: "Movie",
      },
    });

    if (!booking) {
      console.error("❌ Booking not found:", bookingId);
      return res.json({ received: true });
    }

    if (booking.isPaid) {
      console.log("⚠️ Booking already marked paid:", bookingId);
      return res.json({ received: true });
    }

    booking.isPaid = true;
    booking.paymentLink = "";

    await booking.save();

    let userEmail;
    let userName = "User";

    try {
      const user = await User.findById(booking.user);

      if (user) {
        userEmail = user.email;
        userName = user.name;
      }
    } catch (userErr) {
      console.error("❌ User fetch failed:", userErr.message);
    }

    if (!isValidEmail(userEmail)) {
      console.error("❌ Invalid email:", userEmail);
      return res.json({ received: true });
    }

    try {
      await sendEmail({
        to: userEmail,
        subject: `Payment Confirmation - ${booking.show.movie.title}`,
        body: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Hello ${userName},</h2>

            <p>Your booking has been confirmed 🎉</p>

            <h3>${booking.show.movie.title}</h3>

            <p>
              <strong>Date:</strong>
              ${new Date(
                booking.show.showDateTime
              ).toLocaleDateString("en-IN")}
            </p>

            <p>
              <strong>Time:</strong>
              ${new Date(
                booking.show.showDateTime
              ).toLocaleTimeString("en-IN")}
            </p>

            <p>
              <strong>Seats:</strong>
              ${booking.seats.join(", ")}
            </p>

            <p>
              Enjoy your movie 🍿
            </p>
          </div>
        `,
      });

      console.log("📧 Confirmation email sent:", userEmail);
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr.message);
    }

    return res.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return res.status(500).send("Webhook failed");
  }
};