import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getComments, updateComment } from "../controllers/comment.controller.js";


const commentRoute = Router()

commentRoute.route("/add/:mediaId").post(verifyJWT, upload.none(), addComment)

commentRoute.route("/update/:commentId").patch(verifyJWT,upload.none(), updateComment )

commentRoute.route("/delete/:commentId").delete(verifyJWT, deleteComment)

commentRoute.route("/all-comments/:mediaId").get(getComments)
export default commentRoute