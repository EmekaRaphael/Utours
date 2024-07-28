import express from "express";
import { 
    uploadUserPhoto, 
    resizeUserPhoto, 
    getAllUsers, 
    getMe, 
    updateMe, 
    deleteMe, 
    getUser, 
    updateUser, 
    deleteUser 
} from "./../controllers/userController.js";
import { 
    signUp, 
    login, 
    logout, 
    protect, 
    forgotPassword, 
    resetPassword, 
    updatePassword, 
    restrictTo 
} from "../controllers/authController.js";




const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/logout", logout);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protects all routes after this middleware
router.use(protect);

router
    .patch(
        "/updateMyPassword", 
        updatePassword
    );

router
    .get(
        "/me",
        getMe, 
        getUser
    );

router
    .patch(
        "/updateMe", 
        uploadUserPhoto,
        resizeUserPhoto,
        updateMe
    );

router.delete("/deleteMe", deleteMe);

router.use(restrictTo("admin"));

router
    .route("/")
    .get(getAllUsers);

router
    .route("/:id")
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

export { router };