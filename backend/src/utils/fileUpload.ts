import multer, { FileFilterCallback } from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import config from '../config/config';
import { logger } from './logger';
import { AppError } from './errorHandler';

// Define allowed MIME types
type AllowedMimeType = 'application/pdf' | 'application/epub+zip' | 'image/jpeg' | 'image/png';

// Define file interfaces
export interface FileTypes {
  [fieldname: string]: Express.Multer.File[];
}

export type UploadedFile = Express.Multer.File;
export type UploadedFiles = UploadedFile[] | { [fieldname: string]: UploadedFile[] };

// Configure AWS S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

// Configure local storage
const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), config.upload.uploadDir);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter function
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes: AllowedMimeType[] = [
    'application/pdf',
    'application/epub+zip',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype as AllowedMimeType)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload file to S3
export async function uploadToS3(file: UploadedFile, folder: string = 'default'): Promise<string> {
  try {
    const fileStream = fs.createReadStream(file.path);
    const key = `${folder}/${path.basename(file.path)}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.aws.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype
      })
    );

    // Delete local file after successful upload
    fs.unlinkSync(file.path);

    // Return the S3 URL
    return `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new AppError(500, 'Failed to upload file to S3');
  }
}

// Delete file from S3
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const key = fileUrl.split('.com/')[1];
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.aws.bucketName,
        Key: key
      })
    );
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new AppError(500, 'Failed to delete file from S3');
  }
}

// Middleware for handling multiple file uploads
export const uploadFiles = {
  // For book uploads (PDF/ePub + cover image)
  book: upload.fields([
    { name: 'content', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),

  // For single cover image upload
  coverImage: upload.single('coverImage'),

  // For single book content upload
  content: upload.single('content'),

  // For multiple book content uploads
  contents: upload.array('content', 5)
};

// Helper function to process uploaded files
export async function processUploadedFiles(
  files: UploadedFile | UploadedFiles | undefined,
  folder: string = 'default'
): Promise<string | string[] | { [fieldname: string]: string[] }> {
  try {
    if (!files) {
      throw new AppError(400, 'No files uploaded');
    }

    // Handle single file
    if ('fieldname' in files) {
      return await uploadToS3(files as UploadedFile, folder);
    }

    // Handle array of files
    if (Array.isArray(files)) {
      const uploadPromises = files.map(file => uploadToS3(file, folder));
      return await Promise.all(uploadPromises);
    }

    // Handle multiple fields
    const result: { [fieldname: string]: string[] } = {};
    for (const [fieldname, fieldFiles] of Object.entries(files)) {
      const uploadPromises = fieldFiles.map((file: UploadedFile) => 
        uploadToS3(file, `${folder}/${fieldname}`)
      );
      result[fieldname] = await Promise.all(uploadPromises);
    }
    return result;
  } catch (error) {
    logger.error('File processing error:', error);
    throw new AppError(500, 'Failed to process uploaded files');
  }
}