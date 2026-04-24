export type MockVideo = {
  _id: string;
  name: string;
  size: number;
  duration?: number;
  createdAt: number;
  playUrl: string;
};

const STORAGE_KEY = "mock_video_library";

const SEED: MockVideo[] = [
  {
    _id: "mock_video_1",
    name: "Sample Match Footage",
    size: 524288000,
    duration: 1720,
    createdAt: Date.now() - 86400000,
    playUrl: "/master.mp4",
  },
];

function load(): MockVideo[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED;
  } catch {
    return SEED;
  }
}

function save(videos: MockVideo[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
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
