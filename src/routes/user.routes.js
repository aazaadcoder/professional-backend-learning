import { Router } from "express";
import { logOutUser, registerUser,loginUser , refreshAccessToken, getCurrentUser, changePassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory,} from "../controllers/user.controller.js";
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

userRouter.route("/profile").get(verifyJWT, getCurrentUser)

userRouter.route("/profile/change-password").patch(verifyJWT, changePassword)

userRouter.route("/profile/update/info").patch(verifyJWT,upload.none(), updateAccountDetails)
// as we will not expect any file from from data 
//we are using patch as we are


userRouter.route("/profile/update/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
     updateUserAvatar)

userRouter.route("/profile/update/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
    )

userRouter.route("/profile/channel/:userName").get(verifyJWT, getUserChannelProfile)

userRouter.route("/history").get(verifyJWT, getWatchHistory)``
export default userRouter