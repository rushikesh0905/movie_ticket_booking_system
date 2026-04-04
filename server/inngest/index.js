import sendEmail from "../configs/nodeMailer.js";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk", triggers: [{ event: "clerk/user.created" }] },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url,
        };
        await User.create(userData);
    }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
    async ({ event }) => {
        const { id } = event.data;
        await User.findByIdAndDelete(id);
    }
);

// Inngest function to update user in database
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        const userData = {
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url,
        };
        await User.findByIdAndUpdate(id, userData);
    }
);

//Inngest function send email after booking

const sendBookingConfirmationEmail = inngest.createFunction(
    { 
        id: "send-booking-confirmation-email",
        triggers: [{ event: "app/show.booked" }] // ✅ FIXED
    },

    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: { path: "movie", model: "Movie" }
            })
            .populate('user');

        await sendEmail({
            to: booking.user.email,

            subject: `Payment confirmation: "${booking.show.movie.title}" booked!`,

            body: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
  <h2>Hi ${booking.user.name},</h2>

  <p>
    Your booking for 
    <strong style="color: #F84565;">
      "${booking.show.movie.title}"
    </strong> 
    is confirmed.
  </p>

  <p>
    <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}<br/>
    <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
  </p>

  <p>Enjoy the show! 🍿</p>

  <p>
    Thanks for booking with us!<br/>
    – QuickShow Team
  </p>
</div>
`
        });
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    sendBookingConfirmationEmail,
];