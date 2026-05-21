import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

@Controller('upload')
@UseGuards(ClerkAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  uploadImage(@Body() body: { image: string; folder?: string }) {
    return this.uploadService.uploadImage(body.image, body.folder);
  }
}
