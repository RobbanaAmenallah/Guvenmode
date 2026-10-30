import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { getSupabase } from '../config/supabase.js';
import { uuidv4 } from '../utils/uuid.js';

// Memory storage to stream directly to Supabase Storage CDN
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB (supports high-res 4K photos and product videos)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Format non supporté: ${file.mimetype}. Formats acceptés: JPG, PNG, WEBP, MP4, WEBM`));
    }
  }
});

export class UploadController {
  public static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Aucun fichier sélectionné', statusCode: 400 }
        });
      }

      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
      const safePrefix = file.mimetype.startsWith('video') ? 'video' : 'photo';
      const fileName = `${safePrefix}_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;

      const supabase = getSupabase();

      if (supabase) {
        const { data, error } = await supabase.storage
          .from('product-media')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (error) {
          console.error('Supabase Storage upload error:', error);
          return res.status(500).json({
            success: false,
            error: { message: `Erreur stockage Supabase: ${error.message}`, statusCode: 500 }
          });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-media')
          .getPublicUrl(fileName);

        return res.json({
          success: true,
          data: {
            url: publicUrl,
            fileName,
            mimeType: file.mimetype,
            size: file.size,
            is_video: file.mimetype.startsWith('video')
          }
        });
      }

      // Fallback data-uri if Supabase not configured
      const base64 = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;

      res.json({
        success: true,
        data: {
          url: dataUri,
          fileName,
          mimeType: file.mimetype,
          size: file.size,
          is_video: file.mimetype.startsWith('video')
        }
      });
    } catch (err: any) {
      next(err);
    }
  }
}
