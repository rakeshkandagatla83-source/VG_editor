import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getClips = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clips").order("desc").collect();
  },
});

export const addClip = mutation({
  args: {
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clips", {
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      thumbnail: args.thumbnail,
      status: "Ready",
    });
  },
});

export const deleteClip = mutation({
  args: { id: v.id("clips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
