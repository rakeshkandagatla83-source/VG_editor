import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSegments = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingSegments")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const addSegment = mutation({
  args: { sessionId: v.string(), start: v.number(), end: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pendingSegments", {
      sessionId: args.sessionId,
      start: args.start,
      end: args.end,
      createdAt: Date.now(),
    });
  },
});

export const removeSegment = mutation({
  args: { id: v.id("pendingSegments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const clearSegments = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("pendingSegments")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect();
    await Promise.all(docs.map(d => ctx.db.delete(d._id)));
  },
});
