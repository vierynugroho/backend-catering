import multer from "multer";
import sharp from "sharp";
import { deleteFromImageKit, uploadToImageKit } from "../lib/imageKit.js";

// ─── Memory storage: file tidak disentuh disk ─────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak didukung. Gunakan JPEG, PNG, atau WebP."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

export const compressToWebP = async (
  buffer,
  { quality = 80, maxWidth = 1280 } = {},
) => {
  return sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
};

// ─── Compress + langsung upload ke ImageKit ───────────────────────────────────
export const compressAndUploadToImageKit = async (req, _res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const uploadedFileIds = []; // track fileId untuk rollback jika gagal

    try {
      req.uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const compressedBuffer = await compressToWebP(file.buffer);

          const fileName = file.originalname.replace(/\.[^.]+$/, ".webp");

          const result = await uploadToImageKit(compressedBuffer, fileName);

          uploadedFileIds.push(result.fileId);

          const uploadedData = {
            url: result.url,
            fileId: result.fileId,
            fileName: result.name,
          };

          return uploadedData;
        }),
      );
    } catch (uploadError) {
      // Rollback: hapus semua yang sudah terlanjur terupload
      await Promise.allSettled(
        uploadedFileIds.map((fileId) => deleteFromImageKit(fileId)),
      );
      return next(uploadError);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware upload banyak foto (field name: "images", maks 10 file)
 *
 * Urutan pemakaian di route:
 *   router.post('/', uploadMultiple, compressAndUploadToImageKit, handleMulterError, createMenu);
 */
export const uploadMultiple = upload.array("images", 10);

export const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Ukuran file melebihi batas 10 MB.",
      LIMIT_FILE_COUNT: "Jumlah file melebihi batas 10 foto.",
      LIMIT_UNEXPECTED_FILE:
        'Field file tidak dikenali. Gunakan field "images".',
    };

    return res.status(400).json({
      success: false,
      message: messages[err.code] ?? `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  next();
};

export default upload;