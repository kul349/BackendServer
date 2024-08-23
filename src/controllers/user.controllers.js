import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from"../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse}from "../utils/apiResponse.js";
const registerUser=asyncHandler(async(req,res) => {
    //  get user details from forntend
    //validation-not empty
    //check if user is already registered:check username or email
    //check for images and avatar 
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
const existedUser=await User.findOne({
    $or:[{email},{userName}]
})
if(existedUser){
    throw new ApiError(409,"User already exists")
}
const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){
  throw new ApiError(400,"avatar is required");
}
const avatar=await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);
if(!avatar){
  throw new ApiError(400,"avatar is required");
}
const user=await User.create({
  fullName,
  avatar:avatar.url,
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