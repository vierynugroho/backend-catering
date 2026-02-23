import multer from "multer";
import sharp from "sharp";

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
    fileSize: 10 * 1024 * 1024, // Maks 10 MB per file (sebelum dikompres)
    files: 10, // Maks 10 foto sekaligus
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

export const compressFilesToWebP = async (req, _res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    req.files = await Promise.all(
      req.files.map(async (file) => {
        const compressedBuffer = await compressToWebP(file.buffer);

        return {
          ...file,
          buffer: compressedBuffer,
          mimetype: "image/webp",
          originalname: file.originalname.replace(/\.[^.]+$/, ".webp"),
          size: compressedBuffer.length,
        };
      }),
    );

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware upload banyak foto (field name: "images", maks 10 file)
 *
 * Urutan pemakaian di route:
 *   router.post('/', uploadMultiple, compressFilesToWebP, handleMulterError, createMenu);
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
