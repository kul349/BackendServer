import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from"../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse}from "../utils/apiResponse.js";
const generateAccessAndRefreshTokens =async(userId)=>{
  try {
   const user= await User.findById(userId);
   const accessToken = await user.generateAccessToken
   const refreshToken = await user.generateRefreshToken
   user.refreshToken=refreshToken;
   await user.save({validateBeforeSave:false});
   return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500,"something went wrong while generating refresh and access tokens");
  }
}

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
// const coverImageLocalPath=req.files?.coverImage[0]?.path;
let coverImageLocalPath;
if(req.files&&Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
  coverImageLocalPath=req.files.coverImage[0].path
}
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
const loginUser = asyncHandler(async(req, res)=>{

  // it extract the data from the request
const {email,userName,password} =req.body;
// it will check weather userName or email existed user
if(!userName || !email){
  throw new ApiError(400,'userName or password required');
}
// it search the and try to find the userName or email
const user=User.findOne({
  $or:[{userName},{email}]
});
if(!user){
  throw new ApiError(404,"User doesn't exist");
}
const isPasswordvalid=await user.isPasswordCorrect(password);
if(!isPasswordvalid){
  throw new ApiError(401,"Invalid user credentials");
}
const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
const options={
  httpOnly: true,
  secure:true
}
return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options
.json(
  new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},
    "User logged In successfully"
  )
)
)


})
const logoutUser = asyncHandler(async (req, res) => {
 await User.findByIdAndUpdate(
  req.user._id,{
    $set:{
      refreshToken:undefined,
    },
  },
{  
  new:true,
}
 )
 const options={
  httpOnly: true,
  secure:true
}
return res.status(200,)
.clearcookie("accessToken",accessToken,options)
.clearcookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,{},"User logged Out"))
})
export  {registerUser,loginUser,logoutUser};