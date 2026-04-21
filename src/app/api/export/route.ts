import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const { startTime, endTime, filename } = await req.json();

    if (typeof startTime !== "number" || typeof endTime !== "number") {
      return NextResponse.json({ error: "Invalid startTime/endTime" }, { status: 400 });
    }

    const duration = endTime - startTime;
    if (duration <= 0 || duration > 7200) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const videoPath = path.join(process.cwd(), "public", "master.mp4");
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: "Source video not found" }, { status: 404 });
    }

    const safeName = (filename || "clip").replace(/[^a-z0-9_-]/gi, "_");
    const outPath = path.join(os.tmpdir(), `${safeName}_${Date.now()}.mp4`);

    // Run FFmpeg: fast seek (-ss before -i), copy streams (no re-encode = instant)
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-ss", String(startTime),
        "-i", videoPath,
        "-t", String(duration),
        "-c", "copy",            // copy streams — no re-encode, very fast
        "-movflags", "+faststart",
        outPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-500)}`));
      });
      ffmpeg.on("error", reject);
    });

    // Stream the file back then delete it
    const fileBuffer = fs.readFileSync(outPath);
    fs.unlinkSync(outPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeName}.mp4"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Graceful fallback: if ffmpeg not found, tell client to use browser export
    if (message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "ffmpeg_not_found", message: "FFmpeg not installed on server. Falling back to browser export." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
