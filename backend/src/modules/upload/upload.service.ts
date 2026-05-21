import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(base64Data: string, folder = 'negros-delivery') {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new BadRequestException('Cloudinary not configured');
    }

    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'image',
    });

    return { url: result.secure_url, publicId: result.public_id };
  }
}
