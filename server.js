import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { app } from "./app.js";

// process.on('uncaughtException', err => {
//     console.log("UNCAUGHT EXCEPTION, Shutting down!");
//     console.log(err.name, err.message);
//     server.close(() => {
//         process.exit(1);
//     });
// });
process.on('uncaughtException', err => {
    console.error("UNCAUGHT EXCEPTION! Shutting down...");
    console.error(err.name, err.message, err.stack);
    process.exit(1); 
});

const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASSWORD);

mongoose
.connect(DB)
.then(() => console.log("DB connected successfully"));

const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// process.on('unhandledRejection', err => {
//     console.log("UNHANDLED REJECTION, Shutting down!");
//     console.log(err.name, err.message);
//     server.close(() => {
//         process.exit(1);
//     });
// });
process.on('unhandledRejection', err => {
    console.error("UNHANDLED REJECTION! Shutting down...");
    console.error(err.name, err.message, err.stack);
    server.close(() => {
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    console.log("SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("Process terminated!");
    });
});