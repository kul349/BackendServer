// require('dotenv').config({path:"./env"})
import dotenv from 'dotenv';
import mongoose from "mongoose";
import{DB_NAME}from "./constants.js";
import connectDB from "./db/index.js";
dotenv.config({path:"./env"})
import {app} from "./app.js"

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at port ${process.env.PORT}`);
    })
}).catch((error)=>{
    console.log("MONGOODB connection failed!! ", error);
})









/*
import express from "express";
const app = express();
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.log("ERROR:",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on ${process.env.PORT}`);
        })
    }catch(error){
console.error("ERROR:",error);
throw error;
    }
})()
*/