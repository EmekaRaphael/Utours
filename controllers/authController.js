import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { User } from "./../models/userModel.js";
import { catchAsync } from "./../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import bcrypt from 'bcryptjs';
import { Email } from "../utils/email.js";

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode,res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    //Remove password from output
    user.password = undefined

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
}

const signUp = catchAsync(async (req, res, next) => {
    const { name, email, password, passwordConfirm, role } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
        return next(new AppError("All fields are required", 400));
    }

    const newUser = await User.create({
        name,
        email,
        password,
        passwordConfirm,
        role
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //1) check if email & password exist
    if (!email || !password) {
        return next(new AppError("Please provide email and password"), 400);
    }

    //2)check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    //3) if everything is ok, send token to client
    createSendToken(user, 200, res);
});

const logout = (req, res) => {
    res.cookie("jwt", "logged out", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: "success" });
};

const protect = catchAsync(async (req, res, next) => {
    //1) Get token and check if it exists
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please login to gain access.", 401));
    }

    //2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                "The user assigned to this token no longer exists.", 
                401
            )
        );
    }

    //4) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                "User recently changed password! Please login again.", 401
            )
        );
    }
    
    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no errors
const isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try{
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            //2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            //3) Check if user changed password after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            
            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch {
            return next();
        }
    }
    next();
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array ["admin", "lead-guide"]
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("You do not have pemision to perform this operation", 403)
            );
        };
        next();
    };
};

const forgotPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError("There is no user with this email address.", 404));
    }

    //2) Generate the random reset token
    const resetToken = user.createResetToken();
    await user.save({validateBeforeSave: false});

    //3) send it to users email
    try {
        const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: "Success",
            message: "Token sent to email!"
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(
            new AppError("There was an error sending the email. Please try again later!", 
                500
            )
        );
    }
    
});

const resetPassword = catchAsync( async (req, res, next) => {
    //1) Get user based on token
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    //2) If token has not expired, and there is user, set new password
    if(!user) {
        return next(new AppError("Token invalid or has expired", 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) Update changedPasswordAT property for the user


    //4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

const updatePassword = catchAsync(async (req, res, next) => {
    //1) Get user from the collection
    const user = await User.findById(req.user.id).select("+password");

    //2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong.", 401));
    }

    //3) If correct, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4) Log in user, send JWT
    createSendToken(user, 200, res);
});

export {
    signUp,
    login,
    logout,
    protect, 
    isLoggedIn,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword
};