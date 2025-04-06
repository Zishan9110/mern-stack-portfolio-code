import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { SoftwareApplication } from "../models/softwareApplicationSchema.js";
import { v2 as cloudinary } from "cloudinary";

// Add a new software application
export const addNewApplication = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Software Application Icon SVG is required!", 400));
    }
    const { svg } = req.files;
    const { name } = req.body;

    if (!name) {
        return next(new ErrorHandler("Software's Name is required!", 400));
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(
        svg.tempFilePath,
        { folder: "PORTFOLIO_SOFTWARE_APPLICATIONS" }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(
            "Cloudinary Error",
            cloudinaryResponse.error || "Unknown Cloudinary error"
        );
        return next(new ErrorHandler("Failed to upload image to Cloudinary!", 500));
    }

    const softwareApplication = await SoftwareApplication.create({
        name,
        svg: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });

    res.status(200).json({
        success: true,
        message: "New Software Application Added!",
        softwareApplication,
    });
});

// Delete a software application
export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid application ID format!", 400));
    }

    const application = await SoftwareApplication.findById(id);

    if (!application) {
        return next(new ErrorHandler("Application not found!", 404));
    }

    // Delete SVG from Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.destroy(application.svg.public_id);
    if (cloudinaryResponse.error) {
        console.error("Cloudinary Error:", cloudinaryResponse.error);
        return next(new ErrorHandler("Failed to delete image from Cloudinary!", 500));
    }

    // Delete application from the database
    await SoftwareApplication.deleteOne({ _id: id });

    res.status(200).json({
        success: true,
        message: "Software application deleted successfully!",
    });
});

// Get all software applications
export const getAllApplications = catchAsyncErrors(async (req, res, next) => {
    const applications = await SoftwareApplication.find();

    res.status(200).json({
        success: true,
        softwareApplications: applications, // Ensure the key matches what frontend expects
    });
});