import express from "express";
import { 
    getOverview, 
    getTour, 
    getLoginForm, 
    getSignupForm, 
    getAccount,
    getMyTours, 
    updateUserData 
} from "../controllers/viewsController.js";
import { isLoggedIn, protect } from "../controllers/authController.js";


const router = express.Router();


// ROUTES
router.get("/", isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/login", isLoggedIn, getLoginForm);
router.get("/signup", getSignupForm);
router.get("/me", protect, getAccount);
router.get("/my-tours", protect, getMyTours);

router.post("/submit-user-data", protect, updateUserData);


export { router };