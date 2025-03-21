"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = exports.upload = void 0;
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
exports.processUploadedFiles = processUploadedFiles;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = require("./logger");
const errorHandler_1 = require("./errorHandler");
// Configure AWS S3 client
const s3Client = new client_s3_1.S3Client({
    region: config_1.default.aws.region,
    credentials: {
        accessKeyId: config_1.default.aws.accessKeyId,
        secretAccessKey: config_1.default.aws.secretAccessKey
    }
});
// Configure local storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), config_1.default.upload.uploadDir);
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueFilename = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});
// File filter function
const fileFilter = (_req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/epub+zip',
        'image/jpeg',
        'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(400, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
// Upload file to S3
async function uploadToS3(file, folder = 'default') {
    try {
        const fileStream = fs_1.default.createReadStream(file.path);
        const key = `${folder}/${path_1.default.basename(file.path)}`;
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: config_1.default.aws.bucketName,
            Key: key,
            Body: fileStream,
            ContentType: file.mimetype
        }));
        // Delete local file after successful upload
        fs_1.default.unlinkSync(file.path);
        // Return the S3 URL
        return `https://${config_1.default.aws.bucketName}.s3.${config_1.default.aws.region}.amazonaws.com/${key}`;
    }
    catch (error) {
        logger_1.logger.error('S3 upload error:', error);
        throw new errorHandler_1.AppError(500, 'Failed to upload file to S3');
    }
}
// Delete file from S3
async function deleteFromS3(fileUrl) {
    try {
        const key = fileUrl.split('.com/')[1];
        await s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: config_1.default.aws.bucketName,
            Key: key
        }));
    }
    catch (error) {
        logger_1.logger.error('S3 delete error:', error);
        throw new errorHandler_1.AppError(500, 'Failed to delete file from S3');
    }
}
// Middleware for handling multiple file uploads
exports.uploadFiles = {
    // For book uploads (PDF/ePub + cover image)
    book: exports.upload.fields([
        { name: 'content', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    // For single cover image upload
    coverImage: exports.upload.single('coverImage'),
    // For single book content upload
    content: exports.upload.single('content'),
    // For multiple book content uploads
    contents: exports.upload.array('content', 5)
};
// Helper function to process uploaded files
async function processUploadedFiles(files, folder = 'default') {
    try {
        if (!files) {
            throw new errorHandler_1.AppError(400, 'No files uploaded');
        }
        // Handle single file
        if ('fieldname' in files) {
            return await uploadToS3(files, folder);
        }
        // Handle array of files
        if (Array.isArray(files)) {
            const uploadPromises = files.map(file => uploadToS3(file, folder));
            return await Promise.all(uploadPromises);
        }
        // Handle multiple fields
        const result = {};
        for (const [fieldname, fieldFiles] of Object.entries(files)) {
            const uploadPromises = fieldFiles.map((file) => uploadToS3(file, `${folder}/${fieldname}`));
            result[fieldname] = await Promise.all(uploadPromises);
        }
        return result;
    }
    catch (error) {
        logger_1.logger.error('File processing error:', error);
        throw new errorHandler_1.AppError(500, 'Failed to process uploaded files');
    }
}
//# sourceMappingURL=fileUpload.js.map