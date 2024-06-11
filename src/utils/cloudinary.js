require('dotenv').config();
const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const multer = require('multer');

try {
    const storage = multer.diskStorage({
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const filename = file.fieldname + '-' + uniqueSuffix + file.originalname;
            cb(null, filename);
        }
    });

    async function uploadFileToCloud(file) {
        // Check if the file exists and has a path and mimetype
        if (!file || !file.path || !file.mimetype) {
            throw new Error('Invalid file to upload.');
        }
        try {
            // Only proceed if the file type is supported
            const supportedTypes = ['image', 'video', 'audio', 'application']; // Add or remove types based on your needs
            const fileType = file.mimetype.split('/')[0];
    
            if (!supportedTypes.includes(fileType)) {
                throw new Error('Unsupported file type for upload.');
            }
    
            // Use Cloudinary's uploader to upload the file
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'studyfortest',
                resource_type: 'raw', 
            });
    
            // Check if the upload result is valid and contains a URL
            if (!result || !result.url) {
                throw new Error('Failed to upload file to Cloudinary.');
            }
    
            return result.url; // Return the public URL of the uploaded file
        } catch (error) {
            // Log the error for server-side debugging
            console.error('Error uploading file to Cloudinary:', error);
            // Rethrow the error to be handled by the caller
            throw error;
        }
    }


    const uploads = multer({ storage });
    module.exports = { cloudinary, uploads, uploadFileToCloud };
} catch (error) {
    console.log(error)
}