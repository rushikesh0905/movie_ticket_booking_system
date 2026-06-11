import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest/index.js";
import authRouter from "./routes/authRoutes.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

// Database Connection
await connectDB();

// Stripe Webhook (Must Be Before express.json)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
);

// CORS FIX
app.use(cors({
  origin: true,
  credentials: true,
}));

// JSON Parser
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.send('Server is Live!');
});

// Routes
app.use('/api/inngest', serve({ client: inngest, functions }));

app.use('/api/auth', authRouter);

app.use('/api/show', showRouter);

app.use('/api/booking', bookingRouter);

app.use('/api/admin', adminRouter);

app.use('/api/user', userRouter);

// Server Start
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});