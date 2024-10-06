import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { use } from "react";
const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true, //do if we need this for searching it optimizes the searching
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String, // cludinary url we will use
      required: true,
    },

    coverImage: {
      type: String, // cludinary url we will use
    },

    password: {
      type: String, //incripted nahi karna ??
      required: [true, "Password is reuired."], //passing error to throw
    },

    refreshToken: {
      type: String,
    },

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.modified("password")) {
    // harbaar kuch bhi save ekarega  passworwrd baar baar incrypt hoga problem hai isiliye if??
    this.password = bcrypt.hash(this.password, 10);
  } 
  // bcrypt what and rounds?}
  next();
}); 
// for save event, as encrption takes time and cpu proccesing and no arrow fxn this nahi hai, next aage wale ko pass karne ko flag at the end

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCCES_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = Schema("User", userSchema);
