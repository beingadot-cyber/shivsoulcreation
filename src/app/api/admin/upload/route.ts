import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { requireAdminApi } from "@/lib/auth";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "product");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    const isImage = file.type in IMAGE_TYPES;
    const isVideo = file.type in VIDEO_TYPES;
    const imageMax = kind === "hero" ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
    const videoMax = 15 * 1024 * 1024;

    if (kind === "product") {
      if (!isImage)
        return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });
      if (file.size > imageMax)
        return NextResponse.json({ error: "Image must be under 2 MB." }, { status: 400 });
    } else {
      if (!isImage && !isVideo)
        return NextResponse.json({ error: "Only JPG/PNG/WebP images or MP4/WebM videos are allowed." }, { status: 400 });
      if (isImage && file.size > imageMax)
        return NextResponse.json({ error: `Image must be under ${kind === "hero" ? "4" : "2"} MB.` }, { status: 400 });
      if (isVideo && file.size > videoMax)
        return NextResponse.json({ error: "Video must be under 15 MB." }, { status: 400 });
    }

    const ext = isImage ? IMAGE_TYPES[file.type] : VIDEO_TYPES[file.type];
    const name = `uploads/up_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    // Store in Vercel Blob (the server filesystem is read-only on Vercel)
    const blob = await put(name, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({
      ok: true,
      url: blob.url,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (e) {
    console.error("upload", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
