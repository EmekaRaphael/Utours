import { Tour } from "../models/tourModel.js";
import { User } from "../models/userModel.js";
import { Booking } from "../models/bookingModel.js";
import { catchAsync } from "../utils/catchAsync.js";
// import { Email } from "../utils/email.js";


export const alerts = (req, res, next) => {
    const { alert } = req.query;
    if(alert === 'booking')
        res.locals.alert = 
            "Your booking was success! Please check your email for confirmation. If your booking doesn't show up here immediately, please come back later.";
    next();
};

const getOverview = catchAsync(async (req, res, next) => {

    const tours = await Tour.find();

    res.status(200).render("overview", {
        title: "All Tours",
        tours
    });
});

const getTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: "reviews",
        fields: "review rating user"
    });

    if (!tour) {
        return res.status(404).render("error", {
            title: "Something went wrong!",
            msg: "There is no tour with that name."
        });
    }

    res.status(200).render("tour", {
        title: `${tour.name} Tour`,
        tour
    });
});

const getLoginForm = catchAsync(async (req, res) => {
    res.status(200).render("login", {
        title: "Log in"
    });
});

const getSignupForm = catchAsync(async (req, res) => {
    res.status(200).render("signup", {
        title: "Sign up"
    });
});

const getAccount = (req, res) => {
    res.status(200).render("account", {
        title: "Your Account"
    });
};

const getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id })

    // 2) Find tours with the returned IDs
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render("overview", {
        title: "My Tours",
        tours
    });

});

const updateUserData = catchAsync(async (req, res, next) => {
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    });

    res.status(200).render("account", {
        user: updatedUser
    });
});


export { 
    getOverview,
    getTour,
    getLoginForm,
    getSignupForm,
    getAccount,
    getMyTours,
    updateUserData
};