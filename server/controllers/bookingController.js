import Booking from "../models/Booking.js";
import Show from "../models/Show.js"; // ✅ Fix 1: missing Show import
import Stripe from "stripe"; // ✅ Fix 2: Stripe should be capitalized

// ✅ CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated"
      });
    }

    const { showId, selectedSeats } = req.body;

    if (!showId || !selectedSeats?.length) {
      return res.json({
        success: false,
        message: "Missing showId or seats"
      });
    }

    // ✅ Fix 3: fetch show data to get price and movie info
    const showData = await Show.findById(showId).populate('movie');

    if (!showData) {
      return res.json({
        success: false,
        message: "Show not found"
      });
    }

    const booking = await Booking.create({
      user: userId,
      show: showId,
      bookedSeats: selectedSeats, // ✅ Fix 4: was "seats" should be "bookedSeats"
      amount: selectedSeats.length * showData.showPrice // ✅ Fix 5: use actual show price
    });

    // ✅ Fix 6: get origin from request headers
    const origin = req.headers.origin || "http://localhost:5173";

    // Stripe Gateway Initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Fix 7: typo "stripeInsatnce"

    // ✅ Fix 8: creating line items for stripe
    const line_items = [{
      price_data: {
        currency: "usd", // ✅ Fix 9: was "currency_data" should be "currency"
        product_data: { // ✅ Fix 10: was "currency_data" should be "product_data"
          name: showData.movie.title
        },
        unit_amount: Math.floor(booking.amount) * 100 // ✅ Fix 11: typo "unit_amout"
      },
      quantity: 1
    }]

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`, // ✅ Fix 12: typo "success_ulr"
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // ✅ Fix 13: typo "Data.now()"
    })

    booking.paymentLink = session.url
    await booking.save()

    // ✅ Fix 14: removed duplicate res.json - only send one response
    return res.json({ success: true, url: session.url })

  } catch (error) {
    console.error("BOOKING ERROR:", error);
    return res.json({
      success: false,
      message: error.message || "Booking failed"
    });
  }
};

// ✅ GET OCCUPIED SEATS
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const bookings = await Booking.find({ show: showId });

    // ✅ Fix 15: was "seats" should be "bookedSeats"
    const occupiedSeats = bookings.flatMap(b => b.bookedSeats);

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