import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import {ApiRespone} from "../utils/apiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user deatils from frontend
  // validation - if empty
  // check if alreday registered username and email
  //check form images check for avatar
  //upload files to cloundinary, avatar check
  // create user object, as mongodb is nosql - create entry in db
  // remove password and refresh token field from repsonse
  // check for user creation
  // return response

  const { userName, email, fullName, password } = req.body;
  // we have de structed the req.body that is the data given through form or json by frontend

  console.log("email: ", email);

  /*now we will do data validation*/

  // if(fullName === ""){
  //     throw new ApiError(400,"fullName is required.")
  // } // but will you check for every field ??

  // better way

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required.");
  }

  /*now chaking if the user already exists*/

  // hamara user schema mongoose se bana hai it will talk to mongo db for us
  // ya to username match ho jaye ya email id

  const userAlreadyExists = User.findOne($or[({ username }, { email })]);

  if (userAlreadyExists) {
    throw new ApiError(409, "User with this email or username already exists.");
  }

  const avatarLocalPath = req.fields?.avatar[0]?.path;
  const coverImageLocalPath = req.field?.coverImage[0]?.path;

  //check form images check for avatar

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required.");
  }

  //uploading on cloundinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // even though function wrapper retruns a promise we will use await to intennaly wait for this upload to happen aur koi code nahi hoga excute

  /*now we check if avatar was uploaded to cloudinary as it is required field and nahi karenge to db fhat jayega*/

  if (!avatar) {
    throw new ApiError(400, "Avatar Image is required.");
  }

/*  ab hame database mai dalna hai data ko and most of the time User schema hi baat akr raha hota hai db se */

  const user = await User.create(
    {
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),

    }
  )
  //await as db is another continent 

  //check if user entry created in db 

  const createdUser = user.findById(user._id).select(
    "-password -refreshToken"
  )
 // kon kon se select nahi karne hai -pasword etc etc 

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user.")
  }

  return res.status(201).json(
    new ApiRespone(201, createdUser, "user registered successfuly")
  )
  res.status(200).json({
    message: "ok",
    reply: "kaam kar raha hai kya baat hai ",
  });
});

export { registerUser };
