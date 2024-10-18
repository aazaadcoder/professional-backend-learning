import   { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiRespone } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { useId } from "react";
import { ObjectId } from "mongodb";
 
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "name of the playlist required ");
  }

  const playlistData = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlistData) {
    throw new ApiError(500, "error creating the playlist");
  }

  return res
    .status(200)
    .json(new ApiRespone(200, playlistData, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!useId && isValidObjectId(userId)) {
    throw new ApiError(400, "correct userid required");
  }

  const getUserPlaylistData = await Playlist.aggregate([
    {
      $match: { owner: new ObjectId(userId) },
    },
    {
      $project: {
        name: 1,
        description: 1,
      },
    },
  ]);

  if (!getUserPlaylistData) {
    throw new ApiError(500, "user playlist not found in db.");
  }

  return res
    .status(200)
    .json(
      new ApiRespone(
        200,
        getUserPlaylistData,
        "user playlist accessed succesfully."
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlist id required.");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(401, " invalid playlist id ");
  }

  const playlistData = await Playlist.aggregate([
    {
      $match: { _id: new ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videoData",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "videoOwnerData",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              title: 1,
              videoOwnerData: 1,
              thumbnail: 1,
            },
          },
          {
            $addFields: {
              videoOwnerData: {
                $arrayElemAt: ["$videoOwnerData", 0],
              },
            },
          },
        ],
      },
    },

    {
      $project: {
        name: 1,
        description: 1,
        videoData: 1,
      },
    },
  ]);

  if (!playlistData) {
    throw new ApiError(
      500,
      "error fetching playlist id ' s playlist data from db"
    );
  }
  return res
    .status(200)
    .json(
      new ApiRespone(200, playlistData[0], "playlistdata fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "both playlist id and video id required");
  }

  const playlistData = await Playlist.findById(playlistId);

  if (!playlistData.owner.equals(req.user._id)) {
    throw new ApiError(400, " you are not athouried to add video to playlist");
  }

  playlistData.videos.forEach((value)=>{
    if(value.equals(new ObjectId(videoId))){
        throw new ApiError(402, "video already in the playlist")
    }
  })

   const updatedPlaylistData = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylistData) {
    throw new ApiError(
      500,
      "unable to update the playlist data in db or wrong playlist id "
    );
  }

  return res
    .status(200)
    .json(
      new ApiRespone(
        200,
        updatedPlaylistData,
        "video added successfully to playlist."
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "both playlist id and video id required");
  }

  const playlistData = await Playlist.findById(playlistId);

  if (!playlistData.owner.equals(req.user._id)) {
    throw new ApiError(400, " you are not athouried to delete a video to playlist");
  }

  const updatedPlaylistData = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylistData) {
    throw new ApiError(
      500,
      "unable to update the playlist data in db or wrong playlist id "
    );
  }

  return res
    .status(200)
    .json(
      new ApiRespone(
        200,
        updatedPlaylistData,
        "video deleted successfully from playlist."
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  
  if(!playlistId){
    throw new ApiError(400, "playlist id required.")
  }

  const playlistData = await Playlist.findById(playlistId)

  if(!playlistData){
    throw new ApiError(402, "no such playlist found")
  }

  if(!(playlistData.owner.equals(new ObjectId(req.user._id)))){
    throw new ApiError(400, "You are not athorized to modify this playlist.")
  }
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId) 

  if(!deletedPlaylist){
    throw new ApiError(500, "error in deleting form db or wrong playlist id")
}


return res
.status(200)
.json(
   new ApiRespone(
    200,
    deletedPlaylist,
    "playlist deleted successfully."
   )
)
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if(!playlistId){
    throw new ApiError(400, "playlist id required.")
  }

  if(!(name || description)){
    throw new ApiError(400, "name or descirpition required")
  }

  const playlistData = await Playlist.findById(playlistId)

  if(!playlistData){
    throw new ApiError(402, "no such playlist found")
  }

  if(!(playlistData.owner.equals(new ObjectId(req.user._id)))){
    throw new ApiError(400, "You are not athorized to modify this playlist.")
  }
  
  const updatedPlaylistData = await Playlist.findByIdAndUpdate(
    playlistId,
    {
        $set:{
            name: name,
            description: description,
        }
    },
    {new : true}
  )

  if(!updatedPlaylistData){
    throw new ApiError(500, "error in updating form db or wrong playlist id")
}


return res
.status(200)
.json(
   new ApiRespone(
    200,
    updatedPlaylistData,
    "playlist updated successfully."
   )
)

  

});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
