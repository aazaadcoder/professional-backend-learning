import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiErrors.js";
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicIdFromPublicUrl = function(publicUrl){
  const urlBase = "http://res.cloudinary.com/dyhyxgztd/image/upload/"

  if(!publicUrl.startsWith(urlBase)){
    throw new ApiError(401, `Invalid Public Url: ${publicUrl}` )
  }

  let publicId = publicUrl.replace(urlBase, "")

  publicId = publicId.split('/')[1];
  
  publicId = publicId.split('.')[0];

  return publicId
}
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

const deleteOnCloudinary = async function (publicUrl, resourceTypeAsString){
  
  const publicId = getPublicIdFromPublicUrl(publicUrl)
  //eariler i was facing issue as i firstpassed publicUrl and then i had to use string manupilation to get correct publicId as in cloudinary server
  
  try {
    const response = await cloudinary.uploader.destroy(
      publicId,
      {resource_type: resourceTypeAsString}
    )

    if(response.result !== "ok"){
      throw new ApiError(500, "Unable to delete the asset on clodinary.")
    }
    
    console.log("The  image deleted successfully deleted on cloudinary. Old Url: ",publicUrl)

    return response
  
  } catch (error) {
    throw error
    // return null 
  }
}

export { uploadOnCloudinary,deleteOnCloudinary };
