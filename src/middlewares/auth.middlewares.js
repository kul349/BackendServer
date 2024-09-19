import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
export const verfyJWT = asyncHandler(async (req, res, next) => {
  try {
    // const token= req.cookies?.accessToken ||req.header("Authorization")?.replace("Bearer","");
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log(token);

    console.log(token);
    if (!token) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decodedToken); 
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    console.log(user, "userrrrrrrrrrrrrrr");
    
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
 
    next();
  } catch (error) {
    console.log(error);
    
    throw new ApiError(401, error?.message || "Invalid access Token");
  }
});
