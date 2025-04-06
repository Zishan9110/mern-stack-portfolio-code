import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title required"],
    },
    description: {
        type: String,
        required: [true, "Description required"],
    },
    timeline: {
        from: {
            type: String,
            required: [true, "Timeline Starting Date Is Required!"],
        },
        to: String,
    }
   
});

export const Timeline = mongoose.model("Timeline", timelineSchema);
