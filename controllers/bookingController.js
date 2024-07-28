import { initializeTransaction } from "../utils/Paystack.mjs";
import { Tour } from "../models/tourModel.js"; 
import { Booking } from "../models/bookingModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { createOne, deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";
import { configDotenv } from "dotenv";

configDotenv();

const getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    // 2) create checkout session
    const reference = `tour_${req.params.tourId}_${Date.now()}`;
    const email = req.user.email; 
    
    // Paystack expects the amount in kobo, so multiply the price by 100 and then multiply again by the current exchange rate.
    const exchangeRate = 1550;
    const amountInKobo = tour.price * 100 * exchangeRate;  

    try {
        const session = await initializeTransaction(email, amountInKobo, reference, {
            success_url: `${req.protocol}://${req.get("host")}/`,
            cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`
        });

        // 3) create session as response
        res.status(200).json({
            status: "success",
            session
        });
        console.log(session);
    } catch (error) {
        return next(new AppError("Failed to create checkout session", 500));
    }

});

const getAllBookings = getAll(Booking);
const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


export { 
    getCheckoutSession,
    getAllBookings,
    createBooking,
    getBooking,
    updateBooking,
    deleteBooking
};