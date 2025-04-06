import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { genertateToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const register = catchAsyncErrors(async (req, res, next) => {
    // Check if files are present
    if (!req.files || !req.files.avatar || !req.files.resume) {
        return next(new ErrorHandler("Avatar and Resume are required.", 400));
    }

    const { avatar, resume } = req.files;

    // Debugging Logs
    console.log("Uploaded Files:", req.files);

    // Upload Avatar to Cloudinary
    const avatarUpload = await cloudinary.uploader.upload(avatar.tempFilePath, {
        folder: "AVATARS",
    }).catch((err) => {
        console.error("Cloudinary Avatar Upload Error:", err);
        return next(new ErrorHandler("Failed to upload avatar to Cloudinary", 500));
    });

    // Upload Resume to Cloudinary
    const resumeUpload = await cloudinary.uploader.upload(resume.tempFilePath, {
        folder: "RESUMES",
    }).catch((err) => {
        console.error("Cloudinary Resume Upload Error:", err);
        return next(new ErrorHandler("Failed to upload resume to Cloudinary", 500));
    });

    // Debugging Cloudinary responses
    console.log("Avatar Upload Response:", avatarUpload);
    console.log("Resume Upload Response:", resumeUpload);

    // If either upload fails, stop execution
    if (!avatarUpload || !resumeUpload) {
        return;
    }

    const {
        fullName,
        email,
        phone,
        aboutMe,
        password,
        portfolioURL,
        githubURL,
        instagramURL,
        facebookURL,
        twitterURL,
        linkedInURL,
    } = req.body;

    // Create user with the required fields
    const user = await User.create({
        fullName,
        email,
        phone,
        aboutMe,
        password,
        portfolioURL,
        githubURL,
        instagramURL,
        facebookURL,
        twitterURL,
        linkedInURL,
        avatar: {
            public_id: avatarUpload.public_id,
            url: avatarUpload.secure_url,
        },
        resume: {
            public_id: resumeUpload.public_id,
            url: resumeUpload.secure_url,
        },
    }).catch((err) => {
        console.error("Database Error:", err);
        return next(new ErrorHandler("Failed to save user to the database.", 500));
    });

    // Response on successful registration
    genertateToken(user, "User Registered", 201, res)
});

export const login = catchAsyncErrors(async (req, res, next)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler("Email And Password Are Required!"));
    }
    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid Email Or Password!"));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email Or Password"));
    }
    genertateToken(user, "Logged In", 200, res);
});

export const logout = catchAsyncErrors(async(req, res, next)=>{
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).
    json({
        success: true,
        message: "Logged Out",
    });
});

export const getUser = catchAsyncErrors(async(req, res, next)=>{
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user,
        });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserdata = {
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        aboutMe: req.body.aboutMe,
        portfolioURL: req.body.portfolioURL,
        githubURL: req.body.githubURL,
        instagramURL: req.body.instagramURL,
        facebookURL: req.body.facebookURL,
        twitterURL: req.body.twitterURL,
        linkedInURL: req.body.linkedInURL,
    };

    console.log("Received Data:", req.body);
    console.log("Files:", req.files);

    if (req.files && req.files.avatar) {
        const avatar = req.files.avatar;
        const user = await User.findById(req.user.id);
        if (user.avatar) {
            await cloudinary.uploader.destroy(user.avatar.public_id);
        }
        const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
            folder: "AVATARS",
        });
        newUserdata.avatar = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.url,
        };
    }

    if (req.files && req.files.resume) {
        const resume = req.files.resume;
        const user = await User.findById(req.user.id);
        if (user.resume) {
            await cloudinary.uploader.destroy(user.resume.public_id);
        }
        const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath, {
            folder: "RESUMES",
        });
        newUserdata.resume = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.url,
        };
    }

    // ✅ Use `findByIdAndUpdate` instead of `findById`
    const user = await User.findByIdAndUpdate(req.user.id, newUserdata, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        message: "Profile Updated!",
        user,
    });
});


export const updatePassword = catchAsyncErrors(async(req, res, next)=>{
    const {currentPassword, newPassword, confirmNewPassword} = req.body;
    if(!currentPassword || !newPassword || !confirmNewPassword){
        return next(new ErrorHandler("Please Fill All Fields!", 400));
    }
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(currentPassword);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Incorrect Current Password", 400));
    }
    if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("New Password And Confirm New Password Do Not Matching", 400));
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Password Updated!",
    });
});

export const getUserForPortfolio = catchAsyncErrors(async(req, res, next)=>{
    const id = "678d1c0811a3b6b11891af62";
    const user = await User.findById(id);
    res.status(200).json({
        success: true,
        user,

    });
});

export const forgotPassword = catchAsyncErrors(async(req, res, next)=>{
           
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new ErrorHandler("user not found!", 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave: false});
    const resetPasswordUrl = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;
    const message = `Your Reset Password Token Is:- \n\n ${resetPasswordUrl} \n\n if you have not request for this please ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Personal portfolio Dashboard Recovery Password!",
            message,
        });
        res.status(200).json({
            success: true,
            message: `Email Sent To ${user.email} Successfully!`,
        })
    } catch (error) {
        user.resetPasswordExpire=undefined;
        user.resetPasswordToken=undefined;
        await user.save();
        return next(new ErrorHandler(error.message, 500));
        
    }
});

export const resetPassword = catchAsyncErrors(async(req, res, next)=>{
    const {token} = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()},
    });

    if(!user){
        return next(new ErrorHandler("Reset Password token is invalid or has been expired", 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password And Confirm Password do not match!"))
    }
    user.password = req.body.password;
    user.resetPasswordExpire= undefined;
    user.resetPasswordToken=undefined;
    await user.save();
    genertateToken(user, "Reset Password Successfully!", 200, res);
});
