import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = 3000;

await connectDB();

//Stripe Webhooks Route

app.use('/api/stripe',express.raw({type:'application/json'}),stripeWebhooks)

// ✅ MIDDLEWARES
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

// ✅ IMPORTANT: Clerk middleware with secret key
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

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));