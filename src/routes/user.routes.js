import { Router } from "express";
import { logOutUser, registerUser } from "../controllers/user.controller.js";
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
// if user acces karta hai /users/regis ter then ye method call hoga 

userRouter.route("/login").post(loginUser)


// secured routes 

userRouter.route("/logout").post(verifyJWT, logOutUser)

export default userRouter