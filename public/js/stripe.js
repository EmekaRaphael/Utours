import { loadStripe } from "@stripe/stripe-js";
// import axios from "axios";
import { showAlert } from './alert';

async function initializeStripe() {
    const stripe = await loadStripe(process.env.STRIPE_PK);
    return stripe;
}

export const bookTour = async tourId => {
    try {
        // Initialize Stripe
        const stripe = await initializeStripe();

        // 1) Get checkout session from API
        const response = await fetch(
            `${window.location.protocol}//${window.location.host}/api/v1/bookings/checkout-session/${tourId}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch session');
        }

        const session = await response.json();
        
        // const session = await axios(
        //     // `http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`,
        //     `${req.protocol}://${req.get("host")}/api/v1/bookings/checkout-session/${tourId}`,
        // );
                
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        showAlert("error", err.response ? err.response.data.message : err.message);
        console.log(err);
    }
};