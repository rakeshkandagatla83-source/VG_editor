import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Media Library ─────────────────────────────────────
  videos: defineTable({
    name: v.string(),
    storageId: v.optional(v.id("_storage")),  // for Convex-stored uploads
    url: v.optional(v.string()),               // for externally hosted videos (e.g. Vercel Blob)
    size: v.optional(v.number()),              // bytes
    duration: v.optional(v.number()),          // seconds
    createdAt: v.number(),
  }),

  // ── Editor clips (generated from mark-in/out) ─────────
  clips: defineTable({
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
    status: v.optional(v.string()),
  }),

  // ── Transcript segments ────────────────────────────────
  transcriptSegments: defineTable({
    videoId: v.string(),
    start: v.number(),
    end: v.number(),
    text: v.string(),
    speaker: v.optional(v.string()),
    confidence: v.optional(v.number()),
  }).index("by_video_start", ["videoId", "start"]),

  // ── Pending edit segments (mark-in/out regions) ────────
  pendingSegments: defineTable({
    sessionId: v.string(),
    start: v.number(),
    end: v.number(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
