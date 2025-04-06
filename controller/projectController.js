import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { Project } from "../models/projectSchema.js"; // Import the Project schema
import { v2 as cloudinary } from "cloudinary";

// Add a new project
export const addNewProject = catchAsyncErrors(async (req, res, next) => {
    const { title, description, gitRepoLink, projectLink, technologies, stack, deploy } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Project banner image is required!", 400));
    }
    const { projectBanner } = req.files;

    if (!title || !description || !gitRepoLink || !projectLink || !technologies || !stack || !deploy) {
        return next(new ErrorHandler("All fields are required!", 400));
    }

    // Upload project banner to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(
        projectBanner.tempFilePath,
        { folder: "PORTFOLIO_PROJECT_BANNERS" }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary Error:", cloudinaryResponse.error || "Unknown error");
        return next(new ErrorHandler("Failed to upload project banner!", 500));
    }

    const project = await Project.create({
        title,
        description,
        gitRepoLink,
        projectLink,
        technologies,
        stack,
        deploy,
        projectBanner: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });

    res.status(201).json({
        success: true,
        message: "Project added successfully!",
        project,
    });
});

// Delete a project
export const deleteProject = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid project ID format!", 400));
    }

    const project = await Project.findById(id);

    if (!project) {
        return next(new ErrorHandler("Project not found!", 404));
    }

    // Delete project banner from Cloudinary
    await cloudinary.uploader.destroy(project.projectBanner.public_id);

    // Delete project from the database
    await project.deleteOne();

    res.status(200).json({
        success: true,
        message: "Project deleted successfully!",
    });
});

// Update a project
export const updateProject = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, gitRepoLink, projectLink, technologies, stack, deploy } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid project ID format!", 400));
    }

    const project = await Project.findById(id);

    if (!project) {
        return next(new ErrorHandler("Project not found!", 404));
    }

    // Update project banner if provided
    if (req.files && req.files.projectBanner) {
        const { projectBanner } = req.files;

        // Delete old banner from Cloudinary
        await cloudinary.uploader.destroy(project.projectBanner.public_id);

        // Upload new banner to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(
            projectBanner.tempFilePath,
            { folder: "PORTFOLIO_PROJECT_BANNERS" }
        );

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.error("Cloudinary Error:", cloudinaryResponse.error || "Unknown error");
            return next(new ErrorHandler("Failed to upload new project banner!", 500));
        }

        project.projectBanner = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        };
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (gitRepoLink) project.gitRepoLink = gitRepoLink;
    if (projectLink) project.projectLink = projectLink;
    if (technologies) project.technologies = technologies;
    if (stack) project.stack = stack;
    if (deploy) project.deploy = deploy;

    await project.save();

    res.status(200).json({
        success: true,
        message: "Project updated successfully!",
        project,
    });
});

// Get all projects
export const getAllProjects = catchAsyncErrors(async (req, res, next) => {
    const projects = await Project.find();

    res.status(200).json({
        success: true,
        projects,
    });
});

// Get a single project by ID
export const getSingleProject = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid project ID format!", 400));
    }

    const project = await Project.findById(id);

    if (!project) {
        return next(new ErrorHandler("Project not found!", 404));
    }

    res.status(200).json({
        success: true,
        project,
    });
});
