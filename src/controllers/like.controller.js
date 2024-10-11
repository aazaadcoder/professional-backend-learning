import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiRespone } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ObjectId } from "mongodb";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id required");
  }

  let like = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
    comment: null,
    tweet: null,
  });

  if (like) {
    like = await Like.deleteOne({ _id: like._id });
  } else {
    like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }

  console.log("Like: ", like);

  return res
    .status(200)
    .json(new ApiRespone(200, like, "Successfully toggeled video like."));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment Id needed");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {

  const {page = 1 , pageSize = 2} = req.query

  if(page <1 || pageSize <1){
    throw new ApiError(400, "Require page and pageSize query greater than 0 ")
  }

  console.log(new ObjectId(req.user._id));
//   const likeData2 = await Like.aggregate([
//     {
//       $match: {
//         likedBy: new ObjectId(req.user._id),
//         tweet: null,
//         comment: null,
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "video",
//         foreignField: "_id",
//         as: "videoData",
//         pipeline: [
//           {
//             $lookup: {
//               from: "users",
//               localField: "owner",
//               foreignField: "_id",
//               as: "owner",
//               pipeline: [
//                 {
//                   $project: {
//                     fullName: 1,
//                     avatar: 1,
//                   },
//                   $addFields: {
//                     owner: {
//                       $first: "$owner",
//                     },
//                   },
//                 },
//               ],
//             },
//             $project: {
//               thumbnail: 1,
//               title: 1,
//               duration: 1,
//               views: 1,
//               owner: 1,
//             },
//           },
//         ],
//       },
//       $addFields: {
//         videoData: {
//           $first: "$videoData",
//         },
//       },
//     },
//     {
//       $project: {
//         videoData: 1,
//         createdAt: 1,
//       },
//     },
//   ]);

  const likeData = await Like.aggregate([
    {
        $match:{
            likedBy: new ObjectId(req.user._id),
            tweet: null,
            comment: null,
        }
    },
    {
        $lookup:{
            from:"videos",
            localField: "video",
            foreignField: "_id",
            as : "video",
            pipeline:[
                {
                    $lookup:{
                        from : "users",
                        localField: "owner",
                        foreignField: "_id",
                        as : "owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName: 1,
                                    avatar:1 
                                }
                            }                       
                        ]

                    }
                },
                {
                    $addFields:{
                        owner:{
                            $arrayElemAt : ["$owner", 0]
                        }
                    }
                },
                {
                    $project:{
                        thumbnail : 1,
                        owner: 1, 
                        title: 1,
                        duration : 1, 
                        views: 1, 

                    }
                }
            ]
        },
 
    },
    {
        $addFields:{
             
                video:{
                    $arrayElemAt:["$video", 0 ]
                }
            }
         
    },
    {
        $project:{
            video:1,
            createdAt: 1,   
        }
    },
    {
      $facet:{
        metaData: [{$count : "totalCount"}],
        data: [{$skip : (page-1)*pageSize} , {$limit : pageSize}]
      }
    },
    {
      $addFields:{
        metaData: {
          $arrayElemAt: ["$metaData",0]
        }
      }
    }
  ])
  console.log(likeData);

  return res
    .status(200)
    .json(new ApiRespone(
      200, 
      {
        "metadata": likeData[0].metaData,
        "likeData": likeData[0].data
      }
      , 
      "Liked videos fetched successfully."));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
