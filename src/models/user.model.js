import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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
    },
    fullName: {
        type:String,
        required:true, 
        trim:true, 
        index:true, 
    },
    avater: {
        type:String,// cloudnery url
        required:true, 
    },
    coverImage: {
        type:String,
    },
    watchHistory: {
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    passwords: {
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true});
userSchema.pre("save",async function(next){
    if(!this.ismodified("password")) return next();
    this.password=bcrypt.hash(this.password,10);
    next();
});
userSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            fullName:this.fullName,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
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