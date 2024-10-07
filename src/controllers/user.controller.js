import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiRespone } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSace: false });

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

  console.log("all fileds fine");
  // not giving error if userName is not passed only

  /*now chaking if the user already exists*/

  // hamara user schema mongoose se bana hai it will talk to mongo db for us
  // ya to username match ho jaye ya email id

  const userAlreadyExists = await User.findOne({
    $or: [({ userName }, { email })],
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

  return res.status(
    (200)
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
      $set:{ 
        refreshToken: undefined,
      }
    },
    {
      new: true,
      // now we will updated values in reponse 
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiRespone(200,{},"User Logged Out Successfuly.")
  )
});
export { registerUser, loginUser, logOutUser };
