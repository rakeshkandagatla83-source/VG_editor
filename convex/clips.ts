import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Get clips for a specific video ───────────────────────────────────────────
export const getClips = query({
  args: { videoId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.videoId) {
      return await ctx.db
        .query("clips")
        .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
        .order("desc")
        .collect();
    }
    // fallback: return nothing if no videoId provided
    return [];
  },
});

// ── Add a clip scoped to a video ─────────────────────────────────────────────
export const addClip = mutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clips", {
      videoId: args.videoId,
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      thumbnail: args.thumbnail,
      status: "Ready",
    });
  },
});

// ── Delete a clip ─────────────────────────────────────────────────────────────
export const deleteClip = mutation({
  args: { id: v.id("clips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
