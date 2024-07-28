import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { app } from "./app.js";

process.on('uncaughtException', err => {
    console.log("UNCAUGHT EXCEPTION, Shutting down!");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASSWORD);

mongoose
.connect(DB)
.then(() => console.log("DB connected successfully"));

const server = app.listen(process.env.PORT, () => {
    console.log(`Server Connected Successfully`);
});

process.on('unhandledRejection', err => {
    console.log("UNHANDLED REJECTION, Shutting down!");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

