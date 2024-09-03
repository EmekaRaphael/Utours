import { loadStripe } from "@stripe/stripe-js";
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

        const sessionData = await response.json();

        if (!sessionData || !sessionData.session || !sessionData.session.id) {
            throw new Error('Invalid session data received');
        }

        // Log the sessionData to see its structure
        console.log("Session Data:", sessionData);

        // 2) Check if sessionData is correctly structured
        if (!sessionData || !sessionData.session || !sessionData.session.id) {
            throw new Error('Invalid session data received');
        }

        // 3) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: sessionData.session.id,
        });

    } catch (err) {
        showAlert("error", err.response ? err.response.data.message : err.message);
        console.log(err);
    }
};