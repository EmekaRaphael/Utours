import express from "express";
import { 
    getCheckoutSession, 
    getAllBookings,
    createBooking,
    getBooking,
    updateBooking,
    deleteBooking 
} from "../controllers/bookingController.js";
import { protect, restrictTo } from "../controllers/authController.js";


const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes
router.get(
    "/checkout-session/:tourId", 
    getCheckoutSession
);

router.use(restrictTo("admin", "lead-guide"));

router
    .route("/")
    .get(getAllBookings)
    .post(createBooking);

router
    .route("/:id")
    .get(getBooking)
    .patch(updateBooking)
    .delete(deleteBooking);

export { router };
