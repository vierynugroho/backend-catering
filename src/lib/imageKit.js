import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload buffer ke ImageKit
 * @param {Buffer} fileBuffer  - buffer dari multer (memory storage)
 * @param {string} fileName    - nama file original
 * @param {string} [folder]    - folder tujuan di ImageKit (default: /menus)
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export const uploadToImageKit = async (
  fileBuffer,
  fileName,
  folder = "/menus",
) => {
  const response = await imagekit.upload({
    file: fileBuffer,
    fileName,
    folder,
    useUniqueFileName: true,
    tags: ["menu"],
  });

  return {
    url: response.url,
    fileId: response.fileId,
  };
};

export const deleteFromImageKit = async (fileId) => {
  await imagekit.deleteFile(fileId);
};

export default imagekit;
