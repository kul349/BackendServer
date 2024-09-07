import { Router } from "express";
import { registerDoctor, loginDoctor, logoutDoctor, refreshAccessToken,changeCurrentPasswords,getAllDoctors } from '../controllers/doctor.controller.js';
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
router.route('/doctors').get(getAllDoctors);



export default router