"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-white text-xl font-semibold">Something went wrong</h2>
        <p className="text-gray-400 text-sm max-w-md">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
