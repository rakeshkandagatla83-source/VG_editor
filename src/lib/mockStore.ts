export type MockVideo = {
  _id: string;
  name: string;
  size: number;
  duration?: number;
  createdAt: number;
  playUrl: string;
};

const STORAGE_KEY = "mock_video_library";
const STORAGE_VERSION = "v3_demo_local";
const VERSION_KEY = "mock_video_library_version";

const SEED: MockVideo[] = [
  {
    _id: "mock_video_1",
    name: "Demo Video (Local)",
    size: 1048576,
    duration: 10,
    createdAt: Date.now(),
    playUrl: "/demo-video.mp4",
  },
  {
    _id: "mock_video_2",
    name: "Elephant Dream (Sample)",
    size: 52428800,
    duration: 654,
    createdAt: Date.now() - 172800000,
    playUrl: "/demo-video.mp4", // also fallback to local to prevent crashes
  },
];

function load(): MockVideo[] {
  if (typeof window === "undefined") return SEED;
  try {
    // Reset if version changed (e.g. seed URLs updated)
    if (localStorage.getItem(VERSION_KEY) !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      localStorage.removeItem(STORAGE_KEY);
      return SEED;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED;
  } catch {
    return SEED;
  }
}

function save(videos: MockVideo[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
}

export const mockVideoStore = {
  list: load,
  getById: (id: string) => load().find((v) => v._id === id) ?? null,
  add: (v: MockVideo) => {
    const next = [...load(), v];
    save(next);
    return next;
  },
  remove: (id: string) => {
    const next = load().filter((v) => v._id !== id);
    save(next);
    return next;
  },
};
