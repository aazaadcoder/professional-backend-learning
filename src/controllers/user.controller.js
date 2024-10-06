import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"ok",
        reply:"kaam kar raha hai kya baat hai "
    })
})

export {registerUser}