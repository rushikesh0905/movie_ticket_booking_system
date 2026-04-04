import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const { showId, selectedSeats } = req.body;

    if (!showId || !selectedSeats?.length) {
      return res.json({ success: false, message: "No seats selected" });
    }

    const showData = await Show.findById(showId).populate("movie");

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // ✅ CHECK already booked seats
    const existingBookings = await Booking.find({ show: showId });
    const occupiedSeats = existingBookings.flatMap(b => b.seats);

    const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats.includes(seat));

    if (isAnySeatTaken) {
      return res.json({
        success: false,
        message: "Some seats already booked"
      });
    }

    // ✅ Avoid duplicate unpaid booking for same user/show/seats
    let existingUnpaid = await Booking.findOne({
      user: userId,
      show: showId,
      isPaid: false,
      seats: { $all: selectedSeats, $size: selectedSeats.length }
    });

    if (existingUnpaid) {
      try {
        if (existingUnpaid.stripeSessionId) {
          const stripeSession = await stripe.checkout.sessions.retrieve(existingUnpaid.stripeSessionId);

          if (stripeSession && stripeSession.payment_status === 'paid') {
            existingUnpaid.isPaid = true;
            existingUnpaid.paymentLink = '';
            await existingUnpaid.save();
            return res.json({ success: true, message: 'Booking is already paid' });
          }

          if (stripeSession && stripeSession.status === 'open' && stripeSession.url) {
            existingUnpaid.paymentLink = stripeSession.url;
            await existingUnpaid.save();
            return res.json({ success: true, url: stripeSession.url, message: 'Returning existing unpaid checkout link' });
          }
        }
      } catch (err) {
        console.error('existingUnpaid stripe retrieve error:', err.message || err);
      }

      // If we reach here, previous checkout session is expired/cancelled or invalid.
      // Reuse existing booking record and create a fresh Stripe session.
      const existingBookingId = existingUnpaid._id;

      const refreshedSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: showData.movie.title
              },
              unit_amount: Math.floor(existingUnpaid.amount * 100)
            },
            quantity: 1
          }
        ],
        success_url: `${origin}/my-bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/my-bookings?canceled=true`,
        metadata: {
          bookingId: existingBookingId.toString()
        }
      });

      existingUnpaid.paymentLink = refreshedSession.url;
      existingUnpaid.stripeSessionId = refreshedSession.id;
      await existingUnpaid.save();

      return res.json({
        success: true,
        url: refreshedSession.url,
        message: 'Existing unpaid booking refreshed with new checkout link'
      });
    }

    // ✅ CREATE booking as UNPAID
    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: selectedSeats,
      amount: selectedSeats.length * showData.showPrice,
      isPaid: false
    });

    const origin = req.headers.origin || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: showData.movie.title
            },
            unit_amount: Math.floor(booking.amount * 100)
          },
          quantity: 1
        }
      ],

      success_url: `${origin}/my-bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/my-bookings?canceled=true`,

      metadata: {
        bookingId: booking._id.toString()
      }
    });

    booking.paymentLink = session.url;
    booking.stripeSessionId = session.id;
    await booking.save();

    return res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error("BOOKING ERROR:", error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};

export const refreshBookingPayment = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('show');
    if (!booking || booking.user.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.isPaid) {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    const origin = req.headers.origin || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: booking.show.movie?.title || 'Ticket' },
            unit_amount: Math.floor(booking.amount * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${origin}/my-bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/my-bookings?canceled=true`,
      metadata: { bookingId: booking._id.toString() }
    });

    booking.paymentLink = session.url;
    booking.stripeSessionId = session.id;
    await booking.save();

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('refreshBookingPayment ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET OCCUPIED SEATS
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const bookings = await Booking.find({ show: showId });

    const occupiedSeats = bookings.flatMap(b => b.seats);

    return res.json({
      success: true,
      occupiedSeats
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error fetching seats"
    });
  }
};