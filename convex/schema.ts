import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  videos: defineTable({
    title: v.string(),
    duration: v.number(),
  }),

  clips: defineTable({
    videoId: v.id("videos"),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
    status: v.union(v.literal("Ready"), v.literal("Processing"), v.literal("Failed")),
    createdAt: v.number(),
  }).index("by_video", ["videoId"]),

  // Each row = one transcript segment (word/sentence group)
  transcriptSegments: defineTable({
    videoId: v.string(),          // using string so we don't need a real video doc
    start: v.number(),            // seconds
    end: v.number(),
    text: v.string(),
    speaker: v.optional(v.string()),
    confidence: v.optional(v.number()),
  }).index("by_video_start", ["videoId", "start"]),

  // Pending edit segments (user-defined mark-in/out regions)
  pendingSegments: defineTable({
    sessionId: v.string(),        // browser session key
    start: v.number(),
    end: v.number(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
