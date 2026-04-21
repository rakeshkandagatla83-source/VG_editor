import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get all transcript segments for a video, ordered by start time */
export const getTranscript = query({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptSegments")
      .withIndex("by_video_start", q => q.eq("videoId", args.videoId))
      .order("asc")
      .collect();
  },
});

/** Check if a transcript exists */
export const hasTranscript = query({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    const first = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_video_start", q => q.eq("videoId", args.videoId))
      .first();
    return first !== null;
  },
});

/** Bulk insert transcript segments (replaces any existing) */
export const saveTranscript = mutation({
  args: {
    videoId: v.string(),
    segments: v.array(v.object({
      start: v.number(),
      end: v.number(),
      text: v.string(),
      speaker: v.optional(v.string()),
      confidence: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Clear old transcript for this video
    const existing = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_video_start", q => q.eq("videoId", args.videoId))
      .collect();
    await Promise.all(existing.map(doc => ctx.db.delete(doc._id)));

    // Insert new segments
    await Promise.all(args.segments.map(seg =>
      ctx.db.insert("transcriptSegments", { videoId: args.videoId, ...seg })
    ));
  },
});

/** Clear a transcript */
export const clearTranscript = mutation({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_video_start", q => q.eq("videoId", args.videoId))
      .collect();
    await Promise.all(docs.map(d => ctx.db.delete(d._id)));
  },
});
