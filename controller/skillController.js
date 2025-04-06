import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { Skill } from "../models/skillSchema.js";
import { v2 as cloudinary } from "cloudinary";



// Add a new skill
export const addNewSkill = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Skill Icon SVG is required!", 400));
    }
    const { svg } = req.files;
    const { title, proficiency } = req.body;

    if (!title || !proficiency) {
        return next(new ErrorHandler("Skill Name and Level are required!", 400));
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(
        svg.tempFilePath,
        { folder: "PORTFOLIO_SKILLS_SVGS" }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(
            "Cloudinary Error:",
            cloudinaryResponse.error || "Unknown Cloudinary error"
        );
        return next(new ErrorHandler("Failed to upload image to Cloudinary!", 500));
    }

    const skill = await Skill.create({
        title,
        proficiency,
        svg: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });

    res.status(200).json({
        success: true,
        message: "New Skill Added!",
        skill,
    });
});

// Delete a skill
export const deleteSkill = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid skill ID format!", 400));
    }

    const skill = await Skill.findById(id);

    if (!skill) {
        return next(new ErrorHandler("Skill not found!", 404));
    }

    // Delete SVG from Cloudinary
    if (skill.svg && skill.svg.public_id) {
        const cloudinaryResponse = await cloudinary.uploader.destroy(skill.svg.public_id);
        if (cloudinaryResponse.error) {
            console.error("Cloudinary Error:", cloudinaryResponse.error);
            return next(new ErrorHandler("Failed to delete image from Cloudinary!", 500));
        }
    }

    // Delete skill from the database
    await Skill.deleteOne({ _id: id });

    res.status(200).json({
        success: true,
        message: "Skill deleted successfully!",
    });
});

// Update a skill
export const updateSkill = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { proficiency } = req.body;

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid skill ID format!", 400));
    }

    // Validate proficiency (should be between 1 and 100)
    if (proficiency < 1 || proficiency > 100) {
        return next(new ErrorHandler("Proficiency must be between 1 and 100!", 400));
    }

    const skill = await Skill.findById(id);

    if (!skill) {
        return next(new ErrorHandler("Skill not found!", 404));
    }

    // Update proficiency
    skill.proficiency = proficiency;
    await skill.save();

    res.status(200).json({
        success: true,
        message: "Skill proficiency updated successfully!",
    });
});


// Get all skills
export const getAllSkills = catchAsyncErrors(async (req, res, next) => {
    const skills = await Skill.find();

    res.status(200).json({
        success: true,
        skills,
    });
});