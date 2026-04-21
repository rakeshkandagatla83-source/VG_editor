import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getClips = query({
  args: { videoId: v.optional(v.id("videos")) },
  handler: async (ctx, args) => {
    // If no specific video ID is provided, just return all clips for the prototype.
    const clips = await ctx.db.query("clips").order("desc").collect();
    return clips;
  },
});

export const addClip = mutation({
  args: {
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    thumbnail: v.optional(v.string()),
    videoId: v.optional(v.id("videos")),
  },
  handler: async (ctx, args) => {
    // We use a dummy videoId if not provided to bypass the actual strict requirement for prototype
    // Wait, the schema requires videoId. Let's get or create a default video.
    let videoId = args.videoId;
    if (!videoId) {
      const defaultVideo = await ctx.db.query("videos").first();
      if (defaultVideo) {
        videoId = defaultVideo._id;
      } else {
        videoId = await ctx.db.insert("videos", {
          title: "FULL_MATCH_Portugal_v_Spain_2018_FIFA_World_Cup",
          duration: 7200,
        });
      }
    }
    
    return await ctx.db.insert("clips", {
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      thumbnail: args.thumbnail,
      status: "Ready",
      videoId: videoId,
      createdAt: Date.now(),
    });
  },
});

export const deleteClip = mutation({
  args: { id: v.id("clips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
