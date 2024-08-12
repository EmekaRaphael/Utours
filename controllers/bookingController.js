import Stripe from "stripe";
import { Tour } from "../models/tourModel.js"; 
import { Booking } from "../models/bookingModel.js";
import { catchAsync } from "../utils/catchAsync.js";
// import AppError from "../utils/AppError.js";
import { createOne, deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";
import { configDotenv } from "dotenv";

configDotenv();

// USING STRIPE PAYMENT GATEWAY
const stripe = new Stripe(process.env.STRIPE_SK);

const getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) create checkout session
    const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    },
                },
                quantity: 1,
            }
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    });

    // 3) create session as response
    res.status(200).json({
        status: "success",
        session
    });
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
    // this is only temporary, because it's unsecure: anyone can make bookings without paying.
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0])
});





const getAllBookings = getAll(Booking);
const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


export { 
    getCheckoutSession,
    createBookingCheckout,
    getAllBookings,
    createBooking,
    getBooking,
    updateBooking,
    deleteBooking
};




// USING PAYSTACK PAYMENT GATEWAY__________________________________________________________________________________________________________________________________________________

// import { initializeTransaction } from "../utils/Paystack.mjs";
// const getCheckoutSession = catchAsync(async (req, res, next) => {
//     // 1) Get currently booked tour
//     const tour = await Tour.findById(req.params.tourId);

//     if(!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     // 2) create checkout session
//     const reference = `tour_${req.params.tourId}_${Date.now()}`;
//     const email = req.user.email; 
    
//     // Paystack expects the amount in kobo, so multiply the price by 100 and then multiply again by the current exchange rate.
//     const exchangeRate = 1550;
//     const amountInKobo = tour.price * 100 * exchangeRate;  

//     try {
//         const session = await initializeTransaction(email, amountInKobo, reference, {
//             success_url: `${req.protocol}://${req.get("host")}/`,
//             cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`
//         });

//         // 3) create session as response
//         res.status(200).json({
//             status: "success",
//             session
//         });
//         console.log(session);
//     } catch (error) {
//         return next(new AppError("Failed to create checkout session", 500));
//     }
// });

