import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from"../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
const registerUser=asyncHandler(async(req,res) => {
    //  get user details from forntend
    //validation-not empty
    //check if user is already registered:check username or email
    //check for images and avater 
    //upload them to cloudinary 
    //crate user object- create entry in db
    // remove password and refresh token from response 
    //check for user creation
    //return res
  const {fullName, email,userName, password}=  req.body
  console.log("emal:",email);
  if(
    [fullName, email, userName, password].some((field)=>field?.trim()==="")
  ){
    throw new ApiError(400,"All fileds are required")
}
const existedUser=User.findOne({
    $or:[{email},{userName}]
})
if(existedUser){
    throw new ApiError(409,"User already exists")
}
const avaterLocalPath=req.files?.avater[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avaterLocalPath){
  throw new ApiError(400,"avater is required");
}
const avater=await uploadOnCloudinary(avaterLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);
if(!avater){
  throw new ApiError(400,"Avater is required");
}
const user=await User.create({
  fullName,
  avater:avater.url,
  coverImage:coverImage?.url||"",
  email,
  password,
  userName:userName.toLowerCase()
})
const createdUser=await User.findById(user.id).select(
  "-password -refreshToken"
)
if(!createdUser){
  throw new ApiError(500,"something went wrong while registering the user ");
}
return res.status(200).json(
  new ApiResponse(200,createdUser,"User  registered successfully")
)
})
export  {registerUser};