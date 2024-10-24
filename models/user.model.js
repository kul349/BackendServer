import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
dotenv.config();
const userSchema = new Schema({
    userName: {
        type:String,
        required:true, 
        unique:true, 
        lowercase:true, 
        trim:true, 
        index:true, 
    },
    email: {
        type:String,
        required:true, 
        unique:true, 
        lowercase:true, 
        trim:true, 
        index:true, 
    },
    fullName: {
        type:String,
        required:true, 
        trim:true, 
        index:true, 
    },
    avatar: {
        type:String,// cloudnery url
        required:true, 
    },
    coverImage: {
        type:String,
    },
   
    
    password: {
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String,
    },
    fcmToken: { type: String }, // New field for FCM token

},{timestamps:true});
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    console.log("Hashing password for:", this.email);
    this.password=await bcrypt.hash(this.password,10);
    next();
});
userSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function(){
    console.log('Token Data:', {
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
        avatar: this.avatar
    });
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName,
            avatar: this.avatar

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
}


export const User = mongoose.model('User',userSchema);