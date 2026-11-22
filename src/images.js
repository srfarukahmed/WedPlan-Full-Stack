import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { fail } from "./validation.js";

const supported = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function imageStore(config, stores) {
  const files = stores.db.collection("images.files");
  const imageBase = config.PUBLIC_API_URL + "/api/images/";
  async function save(buffer, purpose, owner) {
    const type = await fileTypeFromBuffer(buffer).catch(() => null);
    if (!type || !supported.has(type.mime)) throw fail(400, "Choose a JPEG, PNG, WebP, or AVIF image.");
    let webp;
    try {
      webp = await sharp(buffer, { limitInputPixels: 36000000 }).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch { throw fail(400, "This image could not be decoded."); }
    let hostedUrl;
    if (config.IMGBB_API_KEY) {
      const form = new FormData();
      const uploadURL = new URL("https://api.imgbb.com/1/upload");
      uploadURL.searchParams.set("key", config.IMGBB_API_KEY);
      form.set("image", webp.toString("base64"));
      try {
        const response = await fetch(uploadURL, { method: "POST", body: form, signal: AbortSignal.timeout(10000) });
        const result = await response.json();
        if (response.ok && result.success && typeof result.data?.url === "string") hostedUrl = result.data.url;
        else console.warn("ImgBB did not create an image (HTTP " + response.status + "). WedPlan will use GridFS.");
      } catch { console.warn("ImgBB mirror was unavailable. The MongoDB copy is available."); }
    }
    const id = randomUUID();
    const stream = stores.images.openUploadStreamWithId(id, id + ".webp", { metadata: { purpose, owner, contentType: "image/webp", ...(hostedUrl ? { hostedUrl } : {}) } });
    await pipeline(Readable.from([webp]), stream);
    return imageBase + id;
  }
  function imageId(value) {
    if (typeof value !== "string") return undefined;
    try {
      const { pathname } = new URL(value);
      return /^\/api\/images\/([a-f0-9-]{36})$/.exec(pathname)?.[1];
    } catch {
      return undefined;
    }
  }
  function publicURL(value) {
    const id = imageId(value);
    return id ? imageBase + id : value;
  }
  async function owns(url, purpose, owner) {
    const id = imageId(url);
    if (!id) return false;
    return Boolean(await files.findOne({ _id: id, "metadata.purpose": purpose, ...(owner ? { "metadata.owner": owner } : {}) }, { projection: { _id: 1 } }));
  }
  async function serve(req, res) {
    const file = await files.findOne({ _id: req.params.id });
    if (!file) throw fail(404, "Image not found.");
    res.set({ "Content-Type": "image/webp", "Content-Length": String(file.length), "Cache-Control": "public, max-age=31536000, immutable" });
    if (req.method === "HEAD") return res.end();
    await pipeline(stores.images.openDownloadStream(file._id), res);
  }
  return { save, owns, serve, publicURL };
}