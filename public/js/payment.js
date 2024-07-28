import axios from 'axios';
import { showAlert } from './alert';


export const bookTour = async (tourId) => {
    try {
        // 1) Get session from API
        const response = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );

        // Log the entire response data for debugging
        console.log('Full response data:', response.data);
        

        // 2) Extract the session and data from the response
        // const { session } = response.data;
        const session = response.data.session;

        if (!session || !session.data) {
            console.error('No session or data found in response');
            showAlert('error', 'No session or data found in response');
            return;
        }

        const { authorization_url } = session.data;
        if (authorization_url) {
            // 3) Redirect to Paystack authorization URL in new tab
            // window.open(authorization_url, '_blank');
            window.location.href = authorization_url;

        } else {
            console.error('Authorization URL is undefined');
            showAlert('error', 'Authorization URL is undefined');
        }

        // 4) if authorization is successful Redirect to success_url else redirect to cancel_url

    } catch (err) {
        console.error('Error:', err.message);
        showAlert("error", err.response ? err.response.data.message : err.message);
    }
};