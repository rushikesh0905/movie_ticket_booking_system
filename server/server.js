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

// Allowed Origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

// Stripe Webhook (Must Be Before express.json)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
);

// CORS
app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked Origin:", origin);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

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