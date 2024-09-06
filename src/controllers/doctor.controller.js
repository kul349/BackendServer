import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Doctor } from "../models/doctor.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    const accessToken = await doctor.generateAccessToken();
    const refreshToken = await doctor.generateRefreshToken();
    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
  }
};

const registerDoctor = asyncHandler(async (req, res) => {
  const { fullName, email, doctorName, password } = req.body;
  console.log(fullName);
  console.log(doctorName);
  console.log(email);
  console.log(password);
  if ([fullName, email, doctorName, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedDoctor = await Doctor.findOne({
    $or: [{ email }, { doctorName }],
  });

  if (existedDoctor) {
    throw new ApiError(409, "Doctor already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : "";


  const doctor = await Doctor.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    doctorName:doctorName.toLowerCase(),
  });

  const createdDoctor = await Doctor.findById(doctor.id).select("-password -refreshToken");
  if (!createdDoctor) {
    throw new ApiError(500, "Error registering the Doctor");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdDoctor, "Doctor registered successfully"));
});

const loginDoctor = asyncHandler(async (req, res) => {
  const { email, doctorName, password } = req.body;

  if (!(doctorName || email)) {
    throw new ApiError(400, "Doctor name or email required");
  }

  const doctor = await Doctor.findOne({
    $or: [{ doctorName }, { email }],
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor does not exist");
  }

  const isPasswordValid = await doctor.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(doctor._id);
  const loggedInDoctor = await Doctor.findById(doctor._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { doctor: loggedInDoctor, accessToken, refreshToken }, "Doctor logged in successfully"));
});

const logoutDoctor = asyncHandler(async (req, res) => {
  await Doctor.findByIdAndUpdate(
    req.Doctor._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Doctor logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const doctor = await Doctor.findById(decodedToken?._id);
    if (!doctor) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== doctor?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(doctor._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPasswords = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const doctor = await Doctor.findById(req.Doctor?.id);

  const isPasswordCorrect = await doctor.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  doctor.password = newPassword;
  await doctor.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export { registerDoctor, loginDoctor, logoutDoctor, refreshAccessToken, changeCurrentPasswords };
