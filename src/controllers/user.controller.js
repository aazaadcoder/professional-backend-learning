import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiRespone } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //?

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      500,
      "Something went wrong while gernrating access and refresh tokens"
    );
  }
};

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

  // console.log(req.body)
  // we have de structed the req.body that is the data given through form or json by frontend

  //   console.log("email: ", email);

  /*now we will do data validation*/

  // if(fullName === ""){
  //     throw new ApiError(400,"fullName is required.")
  // } // but will you check for every field ??

  // better way

  if (
    [fullName, email, userName, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "all fields are required.");
  }

  // not giving error if userName is not passed only

  /*now chaking if the user already exists*/

  // hamara user schema mongoose se bana hai it will talk to mongo db for us
  // ya to username match ho jaye ya email id

  const userAlreadyExists = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (userAlreadyExists) {
    throw new ApiError(409, "User with this email or username already exists.");
  }

  if (!req.files || !req.files.avatar) {
    throw new ApiError(400, "Avatar Image is required.");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // TypeError: Cannot read properties of undefined (reading '0') if no cover image is passsed by user so we will use classic if else

  let coverImageLocalPath;
  if (req.files?.coverImage) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  // console.log(req.files)

  //check form images check for avatar

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required.");
  }

  //uploading on cloundinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(avatar)

  // even though function wrapper retruns a promise we will use await to intennaly wait for this upload to happen aur koi code nahi hoga excute

  /*now we check if avatar was uploaded to cloudinary as it is required field and nahi karenge to db fhat jayega*/

  if (!avatar) {
    throw new ApiError(400, "Avatar Image is required.");
  }

  // if (!fullName || !email || !avatar?.url || !password || !userName) {
  //   throw new Error("All fields are required: fullName, email, avatar, password, userName.");
  // }

  /*  ab hame database mai dalna hai data ko and most of the time User schema hi baat akr raha hota hai db se */

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  //await as db is another continent

  //check if user entry created in db

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // kon kon se select nahi karne hai -pasword etc etc

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  return res
    .status(201)
    .json(new ApiRespone(201, createdUser, "user registered successfuly"));
  //   res.status(200).json({
  //     message: "ok",
  //     reply: "kaam kar raha hai kya baat hai ",
  //   });
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(402, "Username or email required.");
  }

  // now we want ki ya to username ya email match ho jaye

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exits.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //think before calling db as it can be expensive doing many db calls

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  //now only server can modify these cookies , frontend can only see

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespone(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfuly."
      )
    );
});

//logout controller

const logOutUser = asyncHandler(async (req, res) => {
  // logout karne ke liye access token and refresh tokoen ki cookie delete karo and db mai refresh token ko empty karenege
  // now how will we get the userid of the user jiko logout karna hai , so here we will design our own middlware

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        // mongodb query to set
        refreshToken: undefined,
      },
    },
    {
      new: true, // now we will get updated values in reponse
    }
  );

  const options = {
    // with this only server can alter the created cookies
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespone(200, {}, "User Logged Out Successfuly."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //accessing refresh token with the user
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      401,
      "Unauthorized Request.(Your RefershToken not available.)"
    );
  }

  try {
    // checking if the the refresh token was tampered will throw error if token was altered and so we will use try catch to catch this error
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    //DONT REALLY NEED await in this usually

    const user = User.findById(decodedToken?._id);

    //if user cooresponding to this token doesnot exit
    if (!user) {
      throw new ApiError(
        401,
        "Invalid Refersh Token.(user correspondint to refresh token not found.)"
      );
    }

    //now we will match the refresh token provided by the cookie and token coorespoding to that user in db
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        401,
        "Refresh Token Expired.(as it doesnot match the refresh token in db )"
      );
    }

    // now as all verfication is done now we will genrate new tokens with new expiration date

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    const options = {
      httponly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiRespone(
          200,
          {
            accessToken,
            refreshAccessToken,
          },
          "access token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token.");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  //taking input from frontend
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password donot match.");
  }

  //getting full user data from db
  const user = await User.findById(req.user?._id);

  // checking if password match the password in db
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Wrong Old Password.");
  }

  // now setting new password
  user.password = newPassword;
  // saving the password
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRespone(200, {}, "Password Changed Successfuly."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(new ApiRespone(200, user, "User Data Accessed successfuly."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // will use verifyJWT middleware before this 
  const { email, fullName } = req.body;

  // QA: in prodction make different controller for file update

  
  if (!fullName || !email) {
    throw new ApiError(400, "Both fullName and email are required.");
  }

  const isDuplicate = await User.findOne({email})

  if(isDuplicate){
    throw new ApiError(401,"User with this email already exits.")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set: { 
            fullName: fullName
            , email 
          },
    },
    {new: true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
      new ApiRespone(
        200,
        user,
        "Account detials updated successfully."
      )
    )
});

const updateUserAvatar = asyncHandler(async(req,res)=>{

  // verifyJWT will provide with req.user 
  // upload middleware will return req.file(as 1 file only)


  if(!req.file || !req.file?.path){
    throw new ApiError(400, "Avatar Image Required.")
  }

  const localAvatarPath = req.file?.path

  if(!localAvatarPath){
    throw new ApiError(400, "Avatar Local Path Missing.")
  }

  //store cloudinary link of old avtar 
  const oldAvatarUrl = req.user?.avatar

  // now we will upload image to cloudinary 
  const avatar = await uploadOnCloudinary(localAvatarPath)

  if(!avatar.url){
    throw new ApiError(500,"Error uploading avatar to cloudinary.")
  }

  // old cloudinary image ko delete karna hoga after new image has been uploaded 
  const repsonse = await deleteOnCloudinary(oldAvatarUrl) 

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
              avatar: avatar.url,
            }
    },
    {new : true}
  ).select("-password -refreshToken")


    

  return res
  .status(200)
  .json(
    new ApiRespone(
      200,
      user,
      "Avatar Image Updated Successfully."
    )
  )

}) 


const updateUserCoverImage = asyncHandler(async(req,res)=>{

  // verifyJWT will provide with req.user 
  // upload middleware will return req.file(as 1 file only)

  if(!req.file || !req.file?.path){
    throw new ApiError(400, "Cover Image Required.")
  }

  const localCoverImagePath = req.file?.path

  if(!localCoverImagePath){
    throw new ApiError(400, "Cover Image Local Path Missing.")
  }

  // now we will upload image to cloudinary 
  
  let oldCoverImageUrl = ""
  if(req.user?.coverImage){
    oldCoverImageUrl = req.user?.coverImage
  }
  
  const coverImage  = await uploadOnCloudinary(localCoverImagePath)

  if(!coverImage.url ){
    throw new ApiError(500,"Error uploading cover Image to cloudinary.")
  }

  // old cloudinary image ko delete karna hoga if it exists 
  if(oldCoverImageUrl){
    deleteOnCloudinary(oldCoverImageUrl)
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
              coverImage: coverImage.url,
            }
    },
    {new : true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(
    new ApiRespone( 
      200,
      user,
      "Cover Image Updated Successfully."
    )
  )

}) 

const getUserChannelProfile = asyncHandler(async(req,res)=>{

  //now we will access username of the channel from the ulr i.e. the params 
  const {userName} = req.params

  // check if username was passed in params

  if(!userName?.trim()){
    throw new ApiError(400,"Username required.")
  }

  // //check if channel with the usernae exist 
  // const channelExists = await User.findOne({userName})

  // if(!channelExists){
  //   throw new ApiError(400, "The channel with this username doesnot exists.")
  // }

  // we can do above code directly using aggregation pipeline no need for multiple db calls 

   const channel = await User.aggregate([         // will return a array 
    {
      $match:{                                    //stage 1 
        userName : userName?.toLowerCase()
      }
    },
    {
      $lookup:{                                   //stage 2 
        from : "subscriptions", // "Subscription" -> "subscriptions" in mongoDB
        localField: "_id",
        foreignField: "channel",
        as: "suscribers"
      }
    },
    {
      $lookup:{                 // to get list of channel suscribed 
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as:"suscribedTo"
      }
    },
    {
      //now we will add two fields of count of suscribers and suscribed to 
      
      $addFields:{
        subscriberCount:{
          $size: "$suscribers" // count # of doc in suscribers output 
        },
        subscribedToCount: {
          $size: "$suscribedTo"
        },
        isSuscribed:{
          $cond:{
            //finding if the user seeing the channel has his name in the susbcribe field in subscrbers doc 
            if : {$in: [req.user?._id, "$suscribers.subscriber"]} ,
            // in can work with array and object 

            then: true,
            else: false 
          }
        }
      } 
    },
    {
      // now we will project only selected fields that are needed as network traffic will increase 
      $project:{
        fullName: 1,
        userName: 1,
        subscriberCount : 1,
        subscribedToCount :1,
        isSuscribed : 1,
        avatar: 1 ,
        coverImage: 1,
        email: 1
      }

    }

  ])


  if(!channel?.length){
    throw new ApiError(404, "Channel doesnot exists. ")
  }

  return res
  .status(200)
  .json(
    new ApiRespone(
      200,
      channel[0],
      "Channel profile details fectched successfully. "
    )
  )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
