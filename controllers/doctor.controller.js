import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {Rating } from "../models/rating.model.js";


const generateAccessAndRefreshTokens = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    const accessToken = await doctor.generateAccessToken();
    const refreshToken = await doctor.generateRefreshToken();
    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerDoctor = asyncHandler(async (req, res) => {
  
  try {
    const { fullName, email, doctorName, password, specialization,qualification, experience,fcmToken } = req.body;
    console.log(fullName);
    console.log(doctorName);
    console.log(email);
    console.log(password);
    console.log(specialization);
    console.log(qualification);
    console.log(experience)
    console.log(fcmToken);
  
    if (
      [fullName, email, doctorName, password, specialization,qualification, experience].some(
        (field) => field?.trim() === ""
      )
    ) {
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
    const coverImage = coverImageLocalPath
      ? await uploadOnCloudinary(coverImageLocalPath)
      : "";

    const doctor = await Doctor.create({
      fullName,
      avatar: avatar.url,
      email,
      password,
      doctorName: doctorName.toLowerCase(),
      specialization,
      qualification,
      experience,
      fcmToken
      
    });

    const createdDoctor = await Doctor.findById(doctor._id).select(
      "-password -refreshToken"
    );
    if (!createdDoctor) {
      throw new ApiError(500, "Error registering the Doctor");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, createdDoctor, "Doctor registered successfully")
      );
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
});

const loginDoctor = asyncHandler(async (req, res) => {
  const { email, doctorName, password,fcmToken} = req.body;

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
  if (fcmToken && doctor.fcmToken !== fcmToken) {
    doctor.fcmToken = fcmToken;  // Update FCM token in the database
    console.log(fcmToken);
    await doctor.save();  // Save the user with the updated FCM token
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    doctor._id
  );
  const loggedInDoctor = await Doctor.findById(doctor._id).select(
    "-password -refreshToken"
  );

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
        { doctor: loggedInDoctor, accessToken, refreshToken },
        "Doctor logged in successfully"
      )
    );
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
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const doctor = await Doctor.findById(decodedToken?._id);
    if (!doctor) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== doctor?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(doctor._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPasswords = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const doctor = await Doctor.findById(req.Doctor?._id);

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
const getAllDoctors = asyncHandler(async (req, res) => {
  // Extract specialization from query parameters
  const { specialization } = req.query;
  
  // Create a filter object
  const filter = {};
  
  // If specialization is provided, add it to the filter
  if (specialization) {
    filter.specialization = specialization;
  }
  
  // Find doctors based on the filter and exclude sensitive fields like password
  const doctors = await Doctor.find(filter).select("-password -refreshToken");

  // Return the filtered doctors
  return res
    .status(200)
    .json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});


const updateDoctorRatingSummary = async (doctorId) => {
  try {
    const ratings = await Rating.find({ doctorId });
    if (ratings.length === 0) {
      return;
    }

    const totalRatings = ratings.length;
    const sumOfRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = sumOfRatings / totalRatings;

    await Doctor.findByIdAndUpdate(doctorId, {
      'ratingsSummary.averageRating': averageRating,
      'ratingsSummary.totalRatings': totalRatings,
    });
  } catch (error) {
    console.error('Error updating doctor rating summary:', error);
  }
};

// Add a new rating
const addRating = asyncHandler(async (req, res) => {
  const { doctorId, patientId, rating, review } = req.body;

  if (!doctorId || !patientId || rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const newRating = new Rating({
      doctorId,
      patientId,
      rating,
      review,
    });
    await newRating.save();
    await Doctor.findByIdAndUpdate(doctorId, {
      $push: {
        reviews: {
          patient: patientId,    // Reference to the User model
        }
      }
    });

    // Update the doctor's rating summary
    await updateDoctorRatingSummary(doctorId);
 
    
    return res.status(201).json({
      message: 'Rating added successfully',
      rating: newRating,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding rating', error: error.message });
  }
});
  // Fetch ratings and reviews for a doctor
  const getDoctorRatings = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    try {
      // Fetch ratings and populate patient details
      const ratings = await Rating.find({ doctorId })
        .populate('patientId', 'fullName avatar') // Populate patient details
        .select('review rating createdAt'); // Select only review, rating, and timestamp

      // Fetch the doctor's rating summary (if stored in Doctor model)
      const doctor = await Doctor.findById(doctorId, 'ratingsSummary review');

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Send the data back in the response
      return res.status(200).json({
        ratings: ratings.map(rating => ({
          review: rating.review,
          rating: rating.rating, // Individual rating score
          patient: {
            fullName: rating.patientId.fullName, // Patient's full name
            image: rating.patientId.avatar // Patient's profile image
          },
          date: rating.createdAt // Date and time of the rating
        })),
        ratingsSummary: doctor.ratingsSummary, // Doctor's overall ratings summary
      });

    } catch (error) {
      console.error('Error fetching doctor ratings:', error.message);

      return res.status(500).json({ message: 'Error fetching doctor ratings', error: error.message });
    }
});

  


const getAllDoctorsWithoutFilter = asyncHandler(async (req, res) => {
  try {
    // Fetch all doctors and exclude sensitive fields like password and refreshToken
    const doctors = await Doctor.find().select("-password -refreshToken");

    // Return all doctors
    return res
      .status(200)
      .json(new ApiResponse(200, doctors, "All doctors fetched successfully"));
  } catch (error) {
    return res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
});

// doctorController.js

// Export the searchDoctor function

const searchDoctor = async (req, res) => {
  const { specialization } = req.query;
  const query = {};

  // If specialization is provided, add it to the query
  if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' }; // Case insensitive search
  }

  try {
      // Fetch doctors based on the constructed query
      const doctors = await Doctor.find(query);

      // Check if no doctors were found
      if (doctors.length === 0) {
          return res.status(404).json({ message: 'No doctors found matching the criteria.' });
      }

      // Return the found doctors
      return res.status(200).json(doctors);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred while searching for doctors.' });
  }
};

 const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.params.id;  // Assuming you are passing doctor ID in the URL
    const updates = req.body;  // The fields to be updated

    // Fetch the existing doctor data
    let doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Update only the fields provided in the request
    Object.keys(updates).forEach((key) => {
      doctor[key] = updates[key];
    });

    // Save the updated doctor profile
    const updatedDoctor = await doctor.save();

    res.status(200).json(updatedDoctor);  // Return the updated doctor profile
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};



export {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  refreshAccessToken,
  changeCurrentPasswords,
  getAllDoctors,
  addRating,
  getAllDoctorsWithoutFilter,
  searchDoctor,
  updateDoctorProfile,
  getDoctorRatings
};
