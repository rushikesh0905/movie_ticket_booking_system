import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

await connectDB();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);


// ✅ 1. STRIPE WEBHOOK (MUST BE FIRST & RAW)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
);


// ✅ 2. CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));


// ✅ 3. JSON parser (AFTER webhook)
app.use(express.json());


// ✅ 4. Clerk
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY
  })
);


// ROUTES
app.get('/', (req, res) => res.send('Server is Live!'));

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);


app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});