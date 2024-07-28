import axios from 'axios';
import { showAlert } from './alert';


export const bookTour = async (tourId) => {
    try {
        // 1) Get session from API
        const response = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        
        // 2) Extract the session and data from the response
        const session = response.data.session;

        if (!session || !session.data) {
            console.error('No session or data found in response');
            showAlert('error', 'No session or data found in response');
            return;
        }

        const { authorization_url } = session.data;
        if (authorization_url) {
            // 3) Redirect to Paystack authorization URL in new tab
            window.location.href = authorization_url;
        } else {
            // console.error('Authorization URL is undefined');
            showAlert('error', 'Authorization URL is undefined');
        }

    } catch (err) {
        // console.error('Error:', err.message);
        showAlert("error", err.response ? err.response.data.message : err.message);
    }
};