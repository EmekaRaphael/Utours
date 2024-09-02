import Stripe from "stripe";
import { Tour } from "../models/tourModel.js"; 
import { User } from "../models/userModel.js";
import { Booking } from "../models/bookingModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { createOne, deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";
import { configDotenv } from "dotenv";
import { response } from "express";


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
        // success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get("host")}/my-tours`,
        cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    });

    // 3) create session as response
    res.status(200).json({
        status: "success",
        session
    });
});

// const createBookingCheckout = catchAsync(async (req, res, next) => {
//     // this is only temporary, because it's unsecure: anyone can make bookings without paying.
//     const { tour, user, price } = req.query;

//     if (!tour && !user && !price) return next();
//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0])
// });

const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.line_items[0].unit_amount / 100;
    await Booking.create({ tour, user, price });
}

const webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch(err) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    // if(event.type === "checkout.session.completed")
    //     createBookingCheckout(event.data.object);
    // Handle the event
    switch (event.type) {
        case 'checkout-session-completed':
            const checkoutSessionCompleted = event.data.object;
            // Then define and call a function to handle the event checkout.session.completed
            break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();

    // res.status(200).json({ received: true });


};

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
    deleteBooking,
    webhookCheckout
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

