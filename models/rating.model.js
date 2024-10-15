// rating.model.js
import mongoose from "mongoose";
const ratingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Assuming you have a Patient model
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,  // Minimum rating value
    max: 5,  // Maximum rating value
  },
  review: {
    type: String,
    maxlength: 500,  // Optional comment with max length
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,  // Automatically manage createdAt and updatedAt fields
});

export const Rating = mongoose.model('Rating', ratingSchema);
