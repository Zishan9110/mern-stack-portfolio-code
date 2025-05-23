import mongoose from "mongoose";


const dbConnection = ()=>{
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "PORTFOLIO",
    }).
    then(()=>{
        console.log("Connected to database");
    }).catch((error)=>{
        console.log(`some error occured while connecting database ${error}`);
    });
};

export default dbConnection;