/// will verfiy wheather user is there or not logged in 

import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


//if res not neede in function replace it with _
export const verifyJWT = asyncHandler(async (req, _ ,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")   // if mobile wagera mai cokkie na ho to hear se lelo 
    
        if(!token){
            throw new ApiError(401, "Unathorized Access.")
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)// here we are verfiying the intrigity of the token stored in the cokkie by checking if it was the one having the signature of the secret key and if it is not if it was modified it will be rejected by the server 
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token.")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error || "Invalid Access Token.")
        
    }


})