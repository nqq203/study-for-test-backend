const cloudinaryModule = require('cloudinary');
const cloudinary = cloudinaryModule.v2;
// const fs = require('fs');
cloudinary.config({
    cloud_name: 'dkzc50ok0',
    api_key: '236915934187757',
    api_secret: 'VzrTTuK9gRKt7hZZQ-YF7XutsTs',
});
const multer = require('multer');

try {
    const storage = multer.diskStorage({
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const filename = file.fieldname + '-' + uniqueSuffix + file.originalname;
            cb(null, filename);
        },
    });

    async function uploadFileToCloud(file) {
        // Check if the file exists and has a path and mimetype
        if (!file || !file.path || !file.mimetype) {
            throw new Error('Invalid file to upload.');
        }

        try {
            // Only proceed if the file type is supported
            const supportedTypes = ['image', 'video', 'audio']; // Add or remove types based on your needs
            const fileType = file.mimetype.split('/')[0];

            if (!supportedTypes.includes(fileType)) {
                throw new Error('Unsupported file type for upload.');
            }

            // Use Cloudinary's uploader to upload the file
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: fileType, // Ensure the resource type is set based on the file
                // You can add more options here based on Cloudinary's API, like folder, tags, etc.
            });

            // Check if the upload result is valid and contains a secure URL
            if (!result || !result.secure_url) {
                throw new Error('Failed to upload file to Cloudinary.');
            }

            return result.secure_url; // Return the secure URL of the uploaded file
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
