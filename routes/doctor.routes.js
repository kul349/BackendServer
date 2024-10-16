import { Router } from "express";
import { registerDoctor, loginDoctor, logoutDoctor, refreshAccessToken,changeCurrentPasswords,getAllDoctors,addRating,getAllDoctorsWithoutFilter,searchDoctor,updateDoctorProfile ,getDoctorRatings,getDoctorProfile } from '../controllers/doctor.controller.js';
import {upload} from "../middlewares/multer.middlewares.js"
import { docverfyJWT } from "../middlewares/doctor.middleware.js";
const router= Router();

  
router.route("/register").post(
    upload.fields(
        [{
           name:"avatar",
           maxCount:1,
        },
        {
              name:"coverImage",
              maxCount:1
        }

        ]),
    registerDoctor);
    router.route("/login").post(loginDoctor);
// secured route
router.route("/logout").post(docverfyJWT,logoutDoctor);
router.route("/refresh-token").post(refreshAccessToken);
router.route('/change-password').post(changeCurrentPasswords); // Change password
router.route('/getalldoctors').get(getAllDoctors);
router.route('/getAllDoctorsWithoutFilter').get(getAllDoctorsWithoutFilter);
router.route('/addRating').post(addRating);
router.route('/search-doctor').get(searchDoctor);
router.route('/updateDoctor/:id').put(docverfyJWT,updateDoctorProfile);
router.route('/doctor-details/:id').get(docverfyJWT,getDoctorProfile );
router.route('/getRating/:doctorId').get(docverfyJWT,getDoctorRatings);






export default router