import { fitWithin } from "@/lib/talentBench";

/** Longer side, in pixels, of a stored thumbnail: sharp at the card's size and on high-density screens, and small enough to keep in a table row. */
export const THUMBNAIL_PX = 160;

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be read"));
    img.src = src;
  });

/** Scales an image (a data URL) down to a JPEG thumbnail data URL. */
export async function toThumbnail(dataUrl: string): Promise<string> {
  const img = await load(dataUrl);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, THUMBNAIL_PX);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot resize images");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Reads an image file the person chose and returns its thumbnail data URL. */
export function fileToThumbnail(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Choose an image file"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That file could not be read"));
    reader.onload = () => toThumbnail(String(reader.result)).then(resolve, reject);
    reader.readAsDataURL(file);
  });
}
