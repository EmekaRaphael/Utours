// import crypto from "crypto";
// import AppError from "./AppError.js";
import { configDotenv } from "dotenv";

configDotenv();

const verifyPaystackWebhook = (req, res, next) => {
    // const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SK)
    //     .update(JSON.stringify(req.body))
    //     .digest("hex");

    // if (hash === req.headers['x-paystack-signature']) {
    //     next();
    // } else {
    //     return next(new AppError("Unauthorized request", 401));
    // }
    next();
};

export { verifyPaystackWebhook };