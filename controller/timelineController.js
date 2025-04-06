import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { Timeline } from "../models/timelineSchema.js";

// Post a new timeline
export const postTimeline = catchAsyncErrors(async (req, res, next) => {
    const { title, description, from, to } = req.body;

    if (!title || !description || !from || !to) {
        return next(new ErrorHandler("All fields are required!", 400));
    }

    const newtimeline = await Timeline.create({
        title,
        description,
        timeline: { from, to },
    });

    res.status(200).json({
        success: true,
        message: "Timeline Added!",
        newtimeline,
    });
});

// Delete a timeline
export const deleteTimeline = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid Timeline ID format!", 400));
    }

    const timeline = await Timeline.findById(id);

    if (!timeline) {
        return next(new ErrorHandler("Timeline not found!", 404));
    }

    // Delete the timeline
    await Timeline.deleteOne({ _id: id }); // Alternative: await Timeline.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Timeline Deleted!",
    });
});


// Get all timelines
export const getAllTimelines = catchAsyncErrors(async (req, res, next) => {
    const timelines = await Timeline.find();

    res.status(200).json({
        success: true,
        timelines,
    });
});
