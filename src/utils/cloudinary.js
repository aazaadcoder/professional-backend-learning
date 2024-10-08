import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiErrors";
import { response } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (loaclaFilePath) {
  try {
    if (!loaclaFilePath) return null;

    //we are uploadin the file
    const response = await cloudinary.uploader.upload(loaclaFilePath, {
      resource_type: "auto",
    });

    //file upladed succesfully
    console.log("The file has been uploaded successfuly", response.url);
    fs.unlinkSync(loaclaFilePath);
    
    return response;
  } catch (error) {
    fs.unlinkSync(loaclaFilePath);
    // we have deleted the temprory file in the local/server and upload has failed and the file is currpot ad sync will help us excute the command first then move to next

    return null;
  }
};

const deleteOnColudinary = async function (publicId){

  try {
    const repsonse = await cloudinary.uploader.destroy(
      publicId,
      {resource_type: "auto"}
    )

    if(!repsonse){
      throw new ApiError(500, "Unable to delete the asset of avatar on clodinary.")
    }
    
    console.log("The avatar image deleted successfully deleted on cloudinary.")

    return response
  
  } catch (error) {
    
    return null 
  }
}

export { uploadOnCloudinary,deleteOnColudinary };
