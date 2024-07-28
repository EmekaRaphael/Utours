import express from "express";
import { verifyPaystackWebhook } from "../utils/webhook.js";
import { handlePaymentSuccess } from "../controllers/paymentController.js";

const router = express.Router();

// ROUTES
router.post("/webhook", verifyPaystackWebhook, handlePaymentSuccess);

export { router };
