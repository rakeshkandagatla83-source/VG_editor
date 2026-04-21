import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── List all videos ──────────────────────────────────────────────────────────
export const listVideos = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("videos").order("desc").collect();
    return await Promise.all(
      videos.map(async (video) => ({
        ...video,
        playUrl: video.storageId
          ? await ctx.storage.getUrl(video.storageId)
          : video.url ?? null,
      }))
    );
  },
});

// ── Get single video by ID ───────────────────────────────────────────────────
export const getVideo = query({
  args: { id: v.id("videos") },
  handler: async (ctx, { id }) => {
    const video = await ctx.db.get(id);
    if (!video) return null;
    return {
      ...video,
      playUrl: video.storageId
        ? await ctx.storage.getUrl(video.storageId)
        : video.url ?? null,
    };
  },
});

// ── Generate an upload URL for direct browser → Convex storage upload ────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Save video metadata after successful upload ──────────────────────────────
export const saveVideo = mutation({
  args: {
    name: v.string(),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),       // for externally-hosted videos
    size: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("videos", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ── Seed the pre-existing master.mp4 (run once) ──────────────────────────────
export const seedMasterVideo = mutation({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const existing = await ctx.db.query("videos").collect();
    const alreadySeeded = existing.some((v) => v.name === "master.mp4");
    if (alreadySeeded) return null;
    return await ctx.db.insert("videos", {
      name: "master.mp4",
      url,
      createdAt: Date.now(),
    });
  },
});

// ── Delete a video (and its Convex storage blob if present) ─────────────────
export const deleteVideo = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, { id }) => {
    const video = await ctx.db.get(id);
    if (!video) return;
    if (video.storageId) {
      await ctx.storage.delete(video.storageId);
    }
    await ctx.db.delete(id);
  },
});

// ── Update video duration (called after client extracts it) ──────────────────
export const updateDuration = mutation({
  args: { id: v.id("videos"), duration: v.number() },
  handler: async (ctx, { id, duration }) => {
    await ctx.db.patch(id, { duration });
  },
});
