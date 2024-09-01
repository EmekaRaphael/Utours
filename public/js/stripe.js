import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { showAlert } from './alert';

async function initializeStripe() {
    const stripe = await loadStripe('pk_test_51PkqKqFbOlLQvZqUeV7zjhXhJ3cAxwcq9TPL5mrx6ZZ2Kzr8YHU9OHfyUT3Brujde851BfM1iKY0BCjPEfl7f9yg00ASq22Mq3');
    return stripe;
}

export const bookTour = async tourId => {
    try {
        // Initialize Stripe
        const stripe = await initializeStripe();

        // 1) Get checkout session from API
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
                
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        showAlert("error", err.response ? err.response.data.message : err.message);
        console.log(err);
    }
};