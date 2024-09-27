import { Router } from "express";
import { registerDoctor, loginDoctor, logoutDoctor, refreshAccessToken,changeCurrentPasswords,getAllDoctors,addRating,getAllDoctorsWithoutFilter,searchDoctor,updateDoctorProfile } from '../controllers/doctor.controller.js';
import {upload} from "../middlewares/multer.middlewares.js"
import { verfyJWT } from "../middlewares/auth.middlewares.js";
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
router.route("/logout").post(verfyJWT,logoutDoctor);
router.route("/refresh-token").post(refreshAccessToken);
router.route('/change-password').post(changeCurrentPasswords); // Change password
router.route('/getalldoctors').get(getAllDoctors);
router.route('/getAllDoctorsWithoutFilter').get(getAllDoctorsWithoutFilter);
router.route('/addRating').post(addRating);
router.route('/search-doctor').get(searchDoctor);
router.route('/updateDoctor:id').put(verfyJWT,updateDoctorProfile);






export default router