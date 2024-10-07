/// will verfiy wheather user is there or not logged in 

import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";


//if res not neede in function replace it with _
export const verifyJWT = asyncHandler(async (req, _ ,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")   // if mobile wagera mai cokkie na ho to hear se lelo 
    
        if(!token){
            throw new ApiError(401, "Unathorized Access.")
        }
    
        const decodedToken = await jwt.verify(eoken, proccess.env.ACCESS_TOKEN_SECRET)
    
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