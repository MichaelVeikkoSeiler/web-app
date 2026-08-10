import { upload } from "@vercel/blob/client";

async function uploadImage(file: File) {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
  });
  return blob.url;
}

export const uploadPlantPhoto = uploadImage;
export const uploadHeroImage = uploadImage;
export const uploadZoneImage = uploadImage;
export const uploadPlantDocPhoto = uploadImage;
