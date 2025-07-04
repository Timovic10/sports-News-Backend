import cloudinary from "./cloudinary.js";

export const uploadImageToCloudinary = async (filePath, folder = "blog") => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url; // ← the actual image URL to store in DB
};
