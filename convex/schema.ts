import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Media Library ─────────────────────────────────────
  videos: defineTable({
    name: v.optional(v.string()),          // new field (old docs had 'title' instead)
    title: v.optional(v.string()),         // legacy field from old schema
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    size: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.optional(v.number()),     // optional so old docs still validate
  }),

  // ── Editor clips (generated from mark-in/out) ─────────
  clips: defineTable({
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
    status: v.optional(v.string()),
    // legacy fields — kept optional for backward compatibility with existing documents
    createdAt: v.optional(v.number()),
    videoId: v.optional(v.string()),
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
