import AppError from '../utils/AppError.js';

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    let errmsg = err.errmsg || (err.errorResponse && err.errorResponse.errmsg);
    if (errmsg && typeof errmsg === 'string') {
        const value = errmsg.match(/(["'])(\\?.)*?\1/)[0];

        const message = `Duplicate field value: ${value}. Please use another value!`;
        return new AppError(message, 400);
    } else {
        console.error('Unexpected error structure for duplicate fields:', err);
        return new AppError('Duplicate field value detected. Please use another value!', 400);
    }
};

const handleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => 
    new AppError("Invalid token. Please login again!", 401);

const handleJWTExpiredError = () =>
    new AppError("Your token has expired! Please login again.", 401);


const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } 
        // RENDERED WEBSITE
        console.error('ERROR', err);
        return res.status(err.statusCode).render('error', {
            title: "Something went wrong!",
            msg: err.message
        });
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // A) API 
        if (err.isOperational) {
            // a) Operational , trusted error: send message to client
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }   
            // b) Programming or other unknown error: don't leak error details
            // 1) Log error
            console.error('ERROR', err);
            // 2) Send generic meesage 
            return res.status(500).json({
                status: 'Error',
                message: 'Oops, Something went wrong.'
            });

    }
        // B) RENDERED WEBSITE
            // a) Operational , trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).render('error', {
                title: "Something went wrong!",
                msg: err.message
            });
        }   
            // b) Programming or other unknown error: don't leak error details
            // 1) Log error
            console.error('ERROR', err);
            // 2) Send generic meesage
            return res.status(err.statusCode).render('error', {
                title: "Something went wrong!",
                msg: "Please try again later"
            });
};

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }; // Merge error and errorResponse
        error.message = err.message;
        error.name = err.name;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === "ValidationError") error = handleValidationError(error);
        if (error.name === "JsonWebTokenError") error = handleJWTError();
        if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

export default globalErrorHandler;