import express from "express";
import { 
    getAllReviews, 
    setTourUserIds, 
    getReview, 
    createReview, 
    updateReview, 
    deleteReview 
} from "../controllers/reviewController.js";
import { protect, restrictTo } from "../controllers/authController.js";


const router = express.Router({ mergeParams: true });

router.use(protect);

// Routes
router
    .route("/")
    .get(getAllReviews)
    .post(
        restrictTo("user"),
        setTourUserIds,
        createReview
    );

router
    .route("/:id")
    .get(getReview)
    .patch(
        restrictTo("user", "admin"), 
        updateReview
    )
    .delete(
        restrictTo("user", "admin"), 
        deleteReview
    );

    export { router };
