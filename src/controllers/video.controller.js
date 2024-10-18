import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiRespone } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { app } from "../app.js";
import { ObjectId } from "mongodb";
import error from "mongoose/lib/error/index.js";

const isVideoOwner = async function (videoId, userId) {
  const video = await Video.findById(videoId);

  if (video.owner.equals(userId)) {
    return true;
  } else {
    return false;
  }
};
const publishAVideo = asyncHandler(async (req, res) => {
  // before this we will use mullter middleware for file upload so we get file in req.files

  //get video data from user
  const { title, description } = req.body;

  if (!(title || description)) {
    throw new ApiError(400, "Video title and Description required.");
  }

  let videoCloundinary;
  let thumbnailCloundinary;

  try {
    //now we access files from multer
    if (
      !(req.files || req.files?.video[0]?.path || req.files?.thumbnail[0]?.path)
    ) {
      throw new ApiError(400, "Both Video and Thumbnail are required.");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    //now we will upload files on cloundinary

    videoCloundinary = await uploadOnCloudinary(videoLocalPath);
    thumbnailCloundinary = await uploadOnCloudinary(thumbnailLocalPath);

    //check if video and thumbnail uploaded on cloudinary

    if (
      !(
        videoCloundinary ||
        thumbnailCloundinary ||
        videoCloundinary?.url ||
        thumbnailCloundinary?.url
      )
    ) {
      throw new ApiError(
        500,
        "Error in uploading video and thumbnail on cloundinary."
      );
    }

    const video = await Video.create({
      videoFile: videoCloundinary.url,
      thumbnail: thumbnailCloundinary.url,
      title,
      description,
      owner: req.user?._id, // as before this we will pass verifyJWT and get req.user
      duration: videoCloundinary.duration,
      views: 0,
      isPublished: true,
    });

    if (!video) {
      throw new ApiError(500, "Error in uploading the video data on db.");
    }

    return res
      .status(200)
      .json(new ApiRespone(200, video, "Video uploaded successfully on db."));
  } catch (error) {
    console.log(error);

    //not working
    // await deleteOnCloudinary(videoCloundinary.url, "video")
    // await deleteOnCloudinary(thumbnailCloundinary.url, "image")
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = -1,
    
  } = req.query;

  const {userId = req.user._id} = req.params
  //verify jwt before this

  const sortOptions = {};
  const sortDirection = Number(sortType);
  sortOptions[sortBy] = sortDirection;


  const videoData = await Video.aggregate([
    {
      $match: { owner: new ObjectId(userId ), isPublished: true },
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
      },
    },
    {
      $sort: sortOptions,
    },
    {
      $facet: {
        metaData: [
          { $count: "totalCount" },
          {
            $addFields: {
              page: page,
              pageLimit: limit,
              sortBy: sortBy,
              sortType: sortType,
            },
          },
        ],
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
        ],
      },
    },
  ]);

  if (!videoData) {
    throw new ApiError(500, "Error accessing video data.");
  }

  return res.status(200).json(
    new ApiRespone(200, {
      metaData: videoData[0]?.metaData,
      videoData: videoData[0]?.data,
    })
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // before this we will have verifyJWT middleware, we have req.user

 
  if (!videoId) {
    throw new ApiError(400, "Video Id is required to search video.");
  }

  //searching the video using title and incrementing the view count of the video
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  );

  if (!video?._id) {
    throw new ApiError(400, "Video with this Video Id doesnot exists.");
  }

  //adding video to the history of the user watching it

  console.log("Video ID");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $push: {
        watchHistory: video._id,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  console.log("User: ", user);
  console.log("Video:", video);

  if (!user) {
    throw new ApiError(500, "Error in adding video to watch history");
  }

  return res.status(200).json(
    new ApiRespone(
      200,
      {
        userWatchHistory: [user?.watchHistory],
        videoViewCount: video?.views,
      },
      "Video watched succesfully and view count and watch history updated."
    )
  );
});
const getVideoByTitle = asyncHandler(async (req, res) => {
  // before this we will have verifyJWT middleware, we have req.user

  const { titleInput } = req.params;

  if (!titleInput) {
    throw new ApiError(400, "Title is required to search video.");
  }

  //searching the video using title and incrementing the view count of the video
  const video = await Video.findOneAndUpdate(
    { title: titleInput },
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  );

  if (!video?._id) {
    throw new ApiError(400, "Video with this title doesnot exists.");
  }

  //adding video to the history of the user watching it

  console.log("Video ID");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $push: {
        watchHistory: video._id,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  console.log("User: ", user);
  console.log("Video:", video);

  if (!user) {
    throw new ApiError(500, "Error in adding video to watch history");
  }

  return res.status(200).json(
    new ApiRespone(
      200,
      {
        userWatchHistory: [user?.watchHistory],
        videoViewCount: video?.views,
      },
      "Video watched succesfully and view count and watch history updated."
    )
  );
});
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { newTitle, newDecription } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video Id required.");
  }

  if (!(newTitle || newDecription)) {
    throw new ApiError(401, "Title or description required.");
  }

  const video = await Video.findById(videoId);

  if (!isVideoOwner(videoId, req.user?._id)) {
    throw new ApiError(400, "You are not the owner.");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: newTitle,
        description: newDecription,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Error in updating the video.");
  }

  return res
    .status(200)
    .json(
      new ApiRespone(200, updatedVideo, "Video info updated successfully.")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id required");
  }

  if (!isVideoOwner(videoId, req.user._id)) {
    throw new ApiError(402, "You are not authotirzed to delete this video.");
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(500, "Error in deleting the video in db.");
  }

  console.log(video);

  return res
    .status(200)
    .json(new ApiRespone(200, video, "video deleted Successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  if (!isVideoOwner(videoId, req.user._id)) {
    throw new ApiError(401, "You are not athorized to toggle publish status.");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new error(400, "Video does not exists");
  }

  const publicStatus = video.isPublished == true ? false : true;

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: publicStatus,
      },
    },
    { new: true }
  );

  console.log(updatedVideo);
  if (!video) {
    throw new ApiError(500, "Error updating the publish statuts.");
  }

  return res
    .status(200)
    .json(
      new ApiRespone(200, updatedVideo, "Video publish changed successfully.")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoByTitle,
};
