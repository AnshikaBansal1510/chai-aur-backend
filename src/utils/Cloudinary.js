import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME',
  api_key: 'process.env.CLOUDINARY_API_KEY',
  api_secret: 'process.env.CLOUDINARY_API_SECRET'
});

// give local file path in the parameter
// upload it 
// if successfully uploaded - unlink file 

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath)    return null

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    // file has been uploaded successfully...response.url gives the public url after successful upload
    console.log("file is uploaded on cloudinary", response.url);
    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath)   // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
}

export { uploadOnCloudinary }