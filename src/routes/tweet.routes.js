import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";




const tweetRouter = Router()

tweetRouter.route("/add").post(verifyJWT, upload.none(), createTweet)

tweetRouter.route("/all-tweets").get(verifyJWT, getUserTweets)

tweetRouter.route("/update/:tweetId").patch(verifyJWT,upload.none(), updateTweet)

tweetRouter.route("/delete/:tweetId").delete(verifyJWT, deleteTweet)



export default tweetRouter