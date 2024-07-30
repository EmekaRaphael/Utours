import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Tour } from "./../../models/tourModel.js";
import { User } from "../../models/userModel.js";
import { Review } from "../../models/reviewModel.js";

dotenv.config({ path: "./.env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//
const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
);


mongoose
.connect(DB)
.then(() => console.log("DB connected successfully"));

//Read Json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("Data Successfully Loaded");
    } catch (err) {
        console.log(err);
    }
    process.exit(1);
};

//Delete all existing data

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data successfully deleted");
    } catch (err) {
        console.log(err)
    }
    process.exit();
}

if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}
