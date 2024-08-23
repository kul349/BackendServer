import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary =async (localFilePath)=>{
    try {
        if(!localFilePath)return null;
        // upload the finel on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("file is upload on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
    fs.unlinkSync(localFilePath);// remove the temporary file  as the upload operation got failed 
    return null;
    }
}

export {uploadOnCloudinary};