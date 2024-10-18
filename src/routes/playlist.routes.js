import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const playlistRouter = Router()



playlistRouter.route("/create").post(verifyJWT, upload.none(),  createPlaylist)

playlistRouter.route("/all-playlists/:userId").get(getUserPlaylists)

playlistRouter.route("/:playlistId").get(getPlaylistById)

playlistRouter.route("/:playlistId/add-video/:videoId").patch(verifyJWT, addVideoToPlaylist)

playlistRouter.route("/:playlistId/remove-video/:videoId").delete(verifyJWT, removeVideoFromPlaylist)

playlistRouter.route("/delete-playlist/:playlistId").delete(verifyJWT, deletePlaylist)

playlistRouter.route("/update/:playlistId").patch(verifyJWT, upload.none(),updatePlaylist)


export default playlistRouter;