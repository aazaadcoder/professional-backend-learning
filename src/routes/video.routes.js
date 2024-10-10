import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import { 
    publishAVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    getVideoByTitle

} from "../controllers/video.controller.js";
const videoRouter = Router()


videoRouter.route("/publish").post(
    verifyJWT,
    upload.fields(
        [
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1, 
            }

        ]
    ),
    publishAVideo   
)

videoRouter.route("/watch/title/:titleInput").get(verifyJWT, getVideoByTitle)

videoRouter.route("/watch/id/:videoId").get(verifyJWT, getVideoById)

videoRouter.route("/update/:videoId").patch(verifyJWT,upload.none(), updateVideo)

videoRouter.route("/delete/:videoId").post(verifyJWT,upload.none(),deleteVideo )

videoRouter.route("/update/publish-status/:videoId").patch(verifyJWT, upload.none(), togglePublishStatus)

export default videoRouter

