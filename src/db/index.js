import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"; 
const connectDB=async()=>{
    try{
 const conncetionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
 console.log(`\n Mongodb is connected!! DB HOST ${conncetionInstance.connection.host }`)
    }catch(error){
    console.log("MONGOOSE CONNECTION ERROR", error);
    process.exit(1);
    }
}
export default connectDB;