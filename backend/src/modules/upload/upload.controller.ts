import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Delete,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const uploadsDirectory = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDirectory)) {
  mkdirSync(uploadsDirectory, { recursive: true });
}

function generateFilename(file: Express.Multer.File): string {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = extname(file.originalname).toLowerCase();
  return `${file.fieldname}-${uniqueSuffix}${ext}`;
}

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedExtensions = /jpg|jpeg|png|webp|gif|svg|pdf|doc|docx|csv|xlsx/;
  const ext = extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExtensions.test(ext)) {
    return callback(null, true);
  }
  return callback(
    new BadRequestException(
      `File format .${ext} is not allowed. Supported formats: images, pdf, doc, csv, xlsx`,
    ),
    false,
  );
};

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Post('single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDirectory,
        filename: (_req, file, cb) => cb(null, generateFilename(file)),
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
      fileFilter,
    }),
  )
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided in request');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload an image file specifically' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDirectory,
        filename: (_req, file, cb) => cb(null, generateFilename(file)),
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowedImages = /jpg|jpeg|png|webp|gif|svg/;
        const ext = extname(file.originalname).toLowerCase().replace('.', '');
        if (allowedImages.test(ext)) {
          return cb(null, true);
        }
        return cb(
          new BadRequestException(
            `File .${ext} is not a valid image. Supported: JPG, PNG, WEBP, GIF, SVG`,
          ),
          false,
        );
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image provided in request');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Post('multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: uploadsDirectory,
        filename: (_req, file, cb) => cb(null, generateFilename(file)),
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter,
    }),
  )
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided in request');
    }
    return files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));
  }

  @Delete(':filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an uploaded file' })
  deleteFile(@Param('filename') filename: string) {
    const filePath = join(uploadsDirectory, filename);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        return { success: true, message: `File ${filename} deleted successfully` };
      } catch (err: any) {
        throw new BadRequestException(`Failed to delete file: ${err.message}`);
      }
    }
    return { success: true, message: `File ${filename} not found or already deleted` };
  }
}
