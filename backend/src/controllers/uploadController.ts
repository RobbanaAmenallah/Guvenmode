import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getSupabase } from '../config/supabase.js';
import { uuidv4 } from '../utils/uuid.js';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function hasValidMagicBytes(buf: Buffer, mimeType: string): boolean {
  if (!buf || buf.length < 12) return false;

  switch (mimeType) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      );
    case 'image/gif': {
      const header = buf.subarray(0, 6).toString('ascii');
      return header === 'GIF87a' || header === 'GIF89a';
    }
    case 'image/webp':
      return (
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'video/mp4':
    case 'video/quicktime':
      return buf.subarray(4, 8).toString('ascii') === 'ftyp';
    case 'video/webm':
      return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
    default:
      return false;
  }
}

// Memory storage to stream directly to Supabase Storage CDN
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB (supports high-res 4K photos and product videos)
  },
  fileFilter: (req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) {
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
      if (!hasValidMagicBytes(file.buffer, file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le contenu réel du fichier ne correspond pas à un format image ou vidéo valide.',
            statusCode: 400
          }
        });
      }

      const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
      const safePrefix = file.mimetype.startsWith('video') ? 'video' : 'photo';
      const fileName = `${safePrefix}_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;

      const supabase = getSupabase();

      if (supabase) {
        const { error } = await supabase.storage
          .from('product-media')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (error) {
          console.error('Supabase Storage upload error:', error);
          return res.status(500).json({
            success: false,
            error: { message: 'Échec du téléversement sur le stockage Cloud', statusCode: 500 }
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
