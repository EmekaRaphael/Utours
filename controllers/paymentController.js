import { Booking } from "../models/bookingModel.js";
import { Tour } from "../models/tourModel.js";
import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";



const handlePaymentSuccess = catchAsync(async (req, res, next) => {
    const event = req.body;

    console.log("Received webhook event:", event);  // Log the event payload

    // Check if the event is a successful payment
    if(event.event === "charge.success") {
        const { reference, customer, amount } = event.data;
        const exchangeRate = 1550;

        // Find the tour and user associated with the payment
        const tourId = reference.split("_")[1];
        const tour = await Tour.findById(tourId);
        const user = await User.findOne({ email: customer.email });

        if(!tour) {
            console.error(`Tour with ID ${tourId} not found`);
            return next(new AppError("Invalid tour", 400));
        }

        if(!user) {
            console.error(`User with email ${customer.email} not found`);
            return next(new AppError("Invalid user", 400));
        }

        // Create a new booking
        const newBooking = await Booking.create({
            tour: tourId,
            user: user._id,
            price: amount * 100 * exchangeRate, // Convert amount back to original price.
            reference
        });

        console.log("New booking created:", newBooking);  // Log the newly created booking

        res.status(200).json({
            status: "success",
            data: { 
                booking: newBooking
            }
        });
        
    } else {
        res.status(400).json({ 
            status: 'fail', 
            message: 'Unhandled event' 
        });
    }
});

export { handlePaymentSuccess };