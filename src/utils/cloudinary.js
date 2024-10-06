import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    return response.url;
  } catch (error) {
    fs.unlinkSync(loaclaFilePath);
    // we have deleted the temprory file in the local/server and upload has failed and the file is currpot ad sync will help us excute the command first then move to next

    return null;
  }
};

export { uploadOnCloudinary };
