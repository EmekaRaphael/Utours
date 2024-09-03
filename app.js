import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from "cors";
import favicon from "serve-favicon";

import AppError from "./utils/AppError.js";
import globalErrorHandler from "./controllers/errorController.js";
import { router as tourRoutes } from "./routes/tourRoutes.js";
import { router as userRoutes } from "./routes/userRoutes.js";
import { router as reviewRoutes } from "./routes/reviewRoutes.js";
import { router as bookingRoutes } from "./routes/bookingRoutes.js";
import { webhookCheckout } from './controllers/bookingController.js';
import { router as viewRoutes } from "./routes/viewRoutes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Express app
const app = express();

app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
app.options("*", cors());
// app.options("/api/v1/tours/:id", cors());


// serving static files 
app.use(express.static(path.join(__dirname, "public")));

// serving favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Set security HTTP headers
app.use(helmet());
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://api.mapbox.com", "https://cdnjs.cloudflare.com", "https://js.stripe.com", "blob:"],
        styleSrc: ["'self'", "https://api.mapbox.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://api.mapbox.com", "https://q.stripe.com"],
        connectSrc: ["'self'", "https://api.mapbox.com", "https://events.mapbox.com", "ws://127.0.0.1:49735", "ws://127.0.0.1:49741", "https://api.stripe.com", "https://r.stripe.com", "http://localhost:8000"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        formAction: ["'self'", "https://hooks.stripe.com"],
      },
    },
}));


// Development Logging
if (process.env.NODE_ENV_DEV === "developement") {
    app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour"
});
app.use("/api", limiter);

app.post("/webhook-checkout", 
    express.raw({ type: "application/json" }),
    webhookCheckout
);

app.listen(4242, () => console.log('Running on port 4242'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(ExpressMongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            "duration",
            "ratingsQuantity",
            "ratingsAverage",
            "maxGroupSize",
            "difficulty",
            "price"
        ]
    })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// ROUTES
app.use("/", viewRoutes);
app.use("/api/v1/tours", tourRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/bookings", bookingRoutes);


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export { app };