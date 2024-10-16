import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
dotenv.config();
const doctorSchema = new Schema({
  fullName: {
     type: String, 
     required: true,
     index:true,
     trim:true,
 

     },
  email: {
     type: String, 
     required: true, 
     unique: true,
     index:true,
     trim:true,
 

    },
  doctorName: { 
    type: String, 
    required: true, 
    unique: true,
    index:true,
    trim:true,
 
  },
  password: { type: String, 
    required: true },
  phone: { 
    type: String 
},
  specialization: { 
    type: String,  
    required: true,
    index:true, 
    trim:true,

   },
  experience: { 
    type: Number,
    required: true, 

  },
  licenseNumber: {
     type: String,
    //  required: true, 
     unique: true },
  qualifications: [
    {
       type: String,
       required:true

       }
],
  certifications: [
    { 
      type: String,

     }],
  bio: { type: String },
  clinicName: { type: String },
  clinicAddress: { type: String },
  
  workingHours: [
    {
      day: { type: String },
      start: { type: String },
      end: { type: String },
    },
  ],
  consultationFee: { type: Number },
  avatar: { type: String },
  availabilityStatus: { 
    type: String, 
    enum: ['available', 'busy', 'on leave'],
     default: 'available' },
  appointments: [
    { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment' }
    ],
  location: {
    type: { type: String, 
        enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], 
        index: '2dsphere' },
  },
  ratingsSummary: {
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  reviews: [
    {
      patient: {
        type: mongoose.Schema.Types.ObjectId,  // Reference to the Patient model
        ref: 'Patient',
        required: true
      },
      rating: Number, // If you want to store ratings here as well
      review: String  // If you want to store the review here as well
    }
  ],
  isVerified: { type: Boolean, default: false },
  fcmToken: { type: String }, // New field for FCM token

  
},{timestamps:true});

doctorSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
    next();
});
doctorSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}
doctorSchema.methods.generateAccessToken = function(){
    console.log('Token Data:', {
        _id: this._id,
        email: this.email,
        doctorName: this.doctorName,
        fullName: this.fullName,
        specialization:this.specialization
    });
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            doctorName: this.doctorName,
            fullName: this.fullName,
            specialization:this.specialization

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
doctorSchema.methods.generateRefreshToken = function(){
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


 export const Doctor= mongoose.model('Doctor', doctorSchema);
