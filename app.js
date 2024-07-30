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


import AppError from "./utils/AppError.js";
import globalErrorHandler from "./controllers/errorController.js";
import { router as tourRoutes } from "./routes/tourRoutes.js";
import { router as userRoutes } from "./routes/userRoutes.js";
import { router as reviewRoutes } from "./routes/reviewRoutes.js";
import { router as bookingRoutes } from "./routes/bookingRoutes.js";
import { router as viewRoutes } from "./routes/viewRoutes.js";
import { router as webhooksRoutes } from "./routes/webhooksRoutes.js";
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Express app
const app = express();

app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 1) GLOBAL MIDDLEWARES
// serving static files 
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
app.use(helmet());
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://api.mapbox.com", "https://cdnjs.cloudflare.com", "https://js.paystack.co", "blob:"],
        styleSrc: ["'self'", "https://api.mapbox.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://api.mapbox.com"],
        connectSrc: ["'self'", "https://api.mapbox.com", "https://events.mapbox.com",  "https://api.paystack.co", "ws://127.0.0.1:49735" ],
      },
    },
}));

// Development Logging
if (process.env.NODE_ENV === "developement") {
    app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour"
});
app.use("/api", limiter);


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
    // console.log(req.cookies);
    next();
});

// ROUTES
app.use("/", viewRoutes);
app.use("/api/v1/tours", tourRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/webhooks", webhooksRoutes);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export { app };