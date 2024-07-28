import { APIFeatures } from "./../utils/apiFeatures.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const getAll = Model => catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //Execute Query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const document = await features.query;

    //Send Response
    res.status(200).json({
        status: "success",
        results: document.length,
        data: {
            data: document
        }
    });
});

const getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const document = await query;

    if (!document) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            data: document
        }
    });
});

const createOne = Model => catchAsync(async (req, res, next) => {

    const document = await Model.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            data: document
        }
    });
});

const updateOne = Model => catchAsync(async (req, res, next) => {

    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!document) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
        status: "Success",
        data: {
            data: document
        }
    });
});

const deleteOne = Model => catchAsync(async (req, res, next) => {

    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: "Success",
        data: null
    });
});


export {
     getAll,
     getOne,
     createOne,
     updateOne,
     deleteOne
    };