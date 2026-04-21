"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Fall back to a structurally valid dummy URL to pass Convex's deployment name parsing
// This prevents Next.js from crashing and provides the Context for useQuery/useMutation hooks
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://happy-animal-123.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
