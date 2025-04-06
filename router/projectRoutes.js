import express from "express";
import {addNewProject, deleteProject, updateProject, getAllProjects, getSingleProject} from "../controller/projectController.js";
import {isAuthenticated} from "../middleware/auth.js";

const router = express.Router();


 router.post("/add", isAuthenticated, addNewProject);
 router.delete("/delete/:id", isAuthenticated, deleteProject);
 router.put("/update/:id", updateProject);
 router.get("/getall", getAllProjects);
 router.get("/get/:id", getSingleProject);


export default router;