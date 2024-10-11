import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import { upload } from "../middlewares/multer.middleware.js";


const likeRouter = Router()


likeRouter.route("/like-toggle/:videoId").patch(verifyJWT, upload.none(), toggleVideoLike)

likeRouter.route("/liked/videos").get(verifyJWT, upload.none(), getLikedVideos )




export default likeRouter