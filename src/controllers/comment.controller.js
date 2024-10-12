import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { ApiError } from "../utils/apiErrors.js"
import { ApiRespone } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ObjectId } from "mongodb"
 

const getComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {mediaId} = req.params
    const {page = 1, limit = 10} = req.query

    if(page<1 || limit < 1){
        throw new ApiError(400, "page and limit should be greater than 0.")
    }
    if(!mediaId){
        throw new ApiError(400," video id required")
    }

    const commentData = await Comment.aggregate(
        [
            {
                $match:{
                    video: new ObjectId(mediaId),
                    tweet : null
                }
            },
            
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as : "owner",
                    pipeline:[
                        {
                            $project:{
                                userName: 1, 
                                fullName: 1, 
                                avatar: 1,

                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $arrayElemAt: ["$owner", 0 ]
                    }
                }
            },
            {
                $project:{
                    content: 1,
                    owner: 1,  
                }
            },
            {
                $facet:{
                    metaData:[
                        {
                            $count : "totalComment",   
                        },
                        {
                            $addFields:{
                                page: Number(page),
                                pageLimit: Number(limit)
                            }
                        }
                    ],
                    commentData:[
                        {
                            $skip : (Number(page)-1)*Number(limit)

                        },
                        {
                            $limit: Number(limit)
                        }
                    ]
                }
            },
            {
                $addFields:{
                    metaData:{
                        $arrayElemAt: ["$metaData", 0]
                    }
                }
            },{
                $project:{
                    metaData: 1, 
                    commentData: 1, 
                }
            }
        ]
    )

    if(!commentData){
        throw new ApiError(401, "No such video exits with this video id.")
    }

    console.log("commentData: " , commentData)

    return res
    .status(200)
    .json(
        new ApiRespone(
            200, 
            commentData[0],
            "comment data accessed successfully."
        )
    )



    
})


const addComment = asyncHandler(async (req, res) => {
    const {mediaId} = req.params
    
    const {tweetCommentContent = null, videoCommentContent= null } = req.body

    
    if(!(mediaId && (tweetCommentContent || videoCommentContent))){
        throw new ApiError(400, "Both mediaId and comment content are requrired.")
    }
    if(videoCommentContent && tweetCommentContent){
        throw new ApiError(400, "Pass either videoCommentContent or tweetCommentContent")
    }

    let tweetId
    let videoId

    if(tweetCommentContent == null){
        tweetId = null
        videoId = mediaId
    }
    else{
        videoId = null
        tweetId = mediaId
    }
    const comment = await Comment.create(
        {
            content: tweetCommentContent || videoCommentContent,
            owner : req.user._id,
            video : videoId,
            tweet : tweetId
        }
    )
    // .select("-tweet -owner -video") will not work on create 


    if(!comment){
        throw new ApiError(500, "Error creating comment in db")
    }

    console.log(comment)

    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            comment,
            "comment created successfully."
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const {newContent} = req.body

    if(!(commentId && newContent)){
        throw new ApiError(400, "Both comment id and new content needed.")
    }

    const oldCommentData = await Comment.findById(commentId)
    
    if(!oldCommentData){
        throw new ApiError(400, "comment with this comment id doesnot exists")
    }
    if(!(oldCommentData.owner.equals(new ObjectId(req.user._id)))){
        throw new ApiError(400, "you are not athourized to update this comment.")
    }

    const newCommentData = await Comment.findByIdAndUpdate(
        commentId,
        {
            content : newContent
        },
        {new : true}
    )

    if(!newCommentData){
        throw new ApiError(500, "Error in updating the comment")
    }

    console.log(newCommentData)

    return res
    .status(200)
    .json(
        new ApiRespone(
            200,
            newCommentData,
            "Comment updated succesfully."
        )
    )



})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(400, "comment id required.")
    }
    const commentData = await Comment.findByIdAndDelete(commentId)

    if(!commentData){
        throw new ApiError(401, "this comment does not exits")
    }

    console.log(commentData)


    return res
    .status(200)
    .json(
        new ApiRespone(
            200, 
            commentData,
            "Comment Deleted successfully."
        )
    )


})

export {
    getComments, 
    addComment, 
    updateComment,
    deleteComment
    }