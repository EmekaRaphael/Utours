import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { app } from "./app.js";


const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASSWORD);

mongoose
.connect(DB)
.then(() => console.log("DB connected successfully"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on('uncaughtException', err => {
    console.log("UNCAUGHT EXCEPTION, Shutting down!");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', err => {
    console.log("UNHANDLED REJECTION, Shutting down!");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

