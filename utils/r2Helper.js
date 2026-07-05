const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2Client = require('../config/r2');
const { R2_BUCKET_NAME, R2_PUBLIC_URL } = require('../config/env');
const crypto = require('crypto');

/**
 * Upload a file buffer to Cloudflare R2
 * @param {Buffer} buffer - File buffer
 * @param {String} mimetype - File MIME type
 * @returns {String} Public URL of the uploaded file
 */
const uploadFile = async (buffer, mimetype) => {
  try {
    // Generate unique filename
    const fileExtension = mimetype.split('/')[1];
    const fileName = `uninstall-proofs/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: mimetype,
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file to storage.');
  }
};

/**
 * Delete a file from Cloudflare R2
 * @param {String} fileUrl - Full public URL of the file
 */
const deleteFile = async (fileUrl) => {
  try {
    // Extract the key from the public URL
    const key = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ Deleted file from R2: ${key}`);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    // Don't throw error - log it and continue
  }
};

/**
 * Delete multiple files from R2
 * @param {Array<String>} fileUrls - Array of public URLs
 */
const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls || fileUrls.length === 0) return;

  const deletePromises = fileUrls.map((url) => deleteFile(url));
  await Promise.allSettled(deletePromises);
};

module.exports = { uploadFile, deleteFile, deleteMultipleFiles };
