import { Router } from "express";
import { logOutUser, registerUser,loginUser , refreshAccessToken, getCurrentUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()


//now we are adding multer middle ware for file upload and will use field as it accepts multiple files and we are doing the same 
userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            macCount :1,
        },
        {
            name:"coverImage",
            macCount: 1,
        }
    ]),
    registerUser)
// if user acces karta hai /users/register then ye method call hoga 

userRouter.route("/login").post(loginUser)


// secured routes (user should be loged  in to access the route )

userRouter.route("/logout").post(verifyJWT, logOutUser)

userRouter.route("/refresh-token").post(refreshAccessToken)

export default userRouter