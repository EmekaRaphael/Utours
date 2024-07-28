// Paystack.mjs
import { configDotenv } from "dotenv";
import axios from 'axios';

configDotenv();

const PAYSTACK_SK = process.env.PAYSTACK_SK;
const paystackBaseUrl = 'https://api.paystack.co';

// Function to initialize a transaction
export async function initializeTransaction(email, amount, reference) {
  try {
    const response = await axios.post(
      `${paystackBaseUrl}/transaction/initialize`,
      {
        email,
        amount,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SK}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;

  } catch (error) {
    console.log(error.response.data);
  }
};
