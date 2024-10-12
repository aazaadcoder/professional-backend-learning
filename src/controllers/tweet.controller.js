import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/apiErrors.js"
import { ApiRespone} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ObjectId } from "mongodb"

const createTweet = asyncHandler(async (req, res) => {
    const {tweetContent} = req.body

    if(!tweetContent){
        throw new ApiError(400,"tweet content required")
    }
    
    const tweetData = await Tweet.create(
        {
            content: tweetContent,
            owner: req.user._id
        }
    )
    if(!tweetContent){
        throw new ApiError(500,"Error uploading tweet data.")
    }

    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            tweetData,
            "Tweet created successfully"
        )
    )




})

const getUserTweets = asyncHandler(async (req, res) => {
    
    const tweetDataOfUser = await Tweet.aggregate(
        [
            {
                $match:{owner: new ObjectId(req.user._id)}
            },
            {
                $project:{
                    content:1,
                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            tweetDataOfUser,
            "tweets of the user fetched successfully."
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {newTweetContent} = req.body
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }
    const tweetData = await Tweet.findById(tweetId)

    if(!tweetData){
        throw new ApiError(400, "No such tweet exists with this tweet id")
    }

 
    if(!(tweetData.owner.equals(new ObjectId(req.user._id)))){
        throw new ApiError(400, "You are not authorized to update this tweet.")
    }

    const newTweetData = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content : newTweetContent
            }
        },
        {new: true}
    )


    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            newTweetData,
            "tweet updated successfully."
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const tweetData = await Tweet.findById(tweetId)

    if(!tweetData){
        throw new ApiError(400, "No such tweet exists with this tweet id")
    }
    
    if(!(tweetData.owner.equals(new ObjectId(req.user._id)))){
        throw new ApiError(400, "You are not authoried to delete this tweet.")
    }

    const deletedTweetData = await Tweet.findByIdAndDelete(tweetId)


    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            deletedTweetData,
            "tweet deleted successfully."
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
