import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();

    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //  get user details from forntend
  //validation-not empty
  //check if user is already registered:check username or email
  //check for images and avatar
  //upload them to cloudinary
  //crate user object- create entry in db
  // remove password and refresh token from response
  //check for user creation
  //return res
   // Extract user details from frontend
   const { fullName, email, userName, password,fcmToken} = req.body;
   console.log(`FCM Token: ${fcmToken}`);

   if (!fcmToken) {
    return res.status(400).json({ message: "FCM token not provided" });
}
   // Validate that all fields are not empty
   if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
     throw new ApiError(400, "All fields are required");
   }
 
   
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
    fcmToken
    
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user ");
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, `User  registered successfully `));
});
const loginUser = asyncHandler(async (req, res) => {
  // it extract the data from the request
  const { email, userName, password,fcmToken} = req.body;
  // it will check weather userName or email existed user
  if (!(userName || email)) {
    throw new ApiError(400, "userName or password required");
  }
  // it search the and try to find the userName or email
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404,"User with given credentials doesnot exists");
  }
  console.log(user);
  const isPasswordvalid = await user.isPasswordCorrect(password);
  if (!isPasswordvalid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  if (fcmToken && user.fcmToken !== fcmToken) {
    user.fcmToken = fcmToken;  // Update FCM token in the database
    await user.save();  // Save the user with the updated FCM token
  }
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log(refreshToken);
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  console.log('Logout function called');
  
  // Check if req.user is populated
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
  }

  console.log('User ID:', req.user._id);
  const userUpdate=await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );
  if (!userUpdate) {
    console.log('User not found or update failed');
    return res.status(404).json(new ApiResponse(404, {}, "User not found"));
  }

  console.log('User updated:', userUpdate);  const options = {
    httpOnly: true,
    secure: true,
  };
  console.log('Preparing to send response:', new ApiResponse(200, {}, "User logged Out"));

    return res
    .status(200)
    .clearCookie("accessToken", { httpOnly: true, secure: true }) // Clear accessToken cookie
    .clearCookie("refreshToken", { httpOnly: true, secure: true }) // Clear refreshToken cookie
    .json(new ApiResponse(200, {}, "User logged Out"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
  // i think there some mistake 
  if(!incomingRefreshToken) {
    throw new ApiError(401,"unauthorized request");
  }
  try {
    const decodedToken=jwt.verify(
      incomingRefreshToken, 
      process.env.REFRESH_TOKEN_SECRET,
    )
    const user=await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError(401,"Invalid refreshTOken");
    }
    if(incomingRefreshToken!==user?.refreshToken){
    throw new ApiError(401,"Refresh Token is expired or used")
    }
    const options={
      httpOnly:true,
      secure:true
    }
   const {accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user)._id;
    return res
    .status(200),
    cookie(accessToken,"accessToken",options)
    .cookie(newRefreshToken,"newRefreshToken",options)
    .json(new ApiResponse(200,{
      accessToken,refreshToken:newRefreshToken
    },"Access token refreshed"))
  } catch (error) {
    throw new ApiError(401,error?.message|| "Invalid refresh token")
  }
})
const changeCurrentPasswords = asyncHandler(async (req, res) => {
  const {oldPassword,newPassword}=req.body;
 const user=await User.findById(req.user?.id);
 const isPasswordCorrect = await User.isPasswordCorrect(oldPassword);
 if(!isPasswordCorrect){
  throw new ApiError(400,"Invalid old password");
  user.password=newPassword;
  await user.save({validateBeforeSave:false});
  return res
  .status(200)
  .json(new ApiResponse(200,{},"change password successfully"))
 }

})
export { registerUser, loginUser, logoutUser,refreshAccessToken };
