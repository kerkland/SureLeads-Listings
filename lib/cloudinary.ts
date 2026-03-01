import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(
  file: string | Buffer,
  folder = 'prop/listings'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const options = { folder, resource_type: 'image' as const };

    if (Buffer.isBuffer(file)) {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        })
        .end(file);
    } else {
      cloudinary.uploader.upload(file, options, (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
    }
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;

export async function uploadVideo(
  file: string | Buffer,
  folder = 'sureleads/walkthroughs'
): Promise<{ url: string; publicId: string; durationSeconds?: number }> {
  return new Promise((resolve, reject) => {
    const options = { folder, resource_type: 'video' as const };

    if (Buffer.isBuffer(file)) {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            durationSeconds: result.duration ? Math.round(result.duration) : undefined,
          });
        })
        .end(file);
    } else {
      cloudinary.uploader.upload(file, options, (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          durationSeconds: result.duration ? Math.round(result.duration) : undefined,
        });
      });
    }
  });
}

export async function deleteVideo(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
}
