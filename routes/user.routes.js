import { Router } from "express";
import {loginUser, registerUser,logoutUser,refreshAccessToken,changeCurrentPasswords} from "../controllers/user.controllers.js";
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
    registerUser);
    router.route("/login").post(loginUser);
// secured route
router.route("/logout").post(verfyJWT,logoutUser);
router.route('/change-password').post(verfyJWT,changeCurrentPasswords);
router.route("/refresh-token").post(refreshAccessToken);



export default router