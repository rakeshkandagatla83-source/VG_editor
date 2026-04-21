"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Film, Clock, HardDrive, Search, Trash2,
  Play, Plus, MoreVertical, X, CheckCircle, Loader2,
  Home, MonitorPlay, FolderCog, Video, Radio,
  GitMerge, Waypoints, Share2, PlaySquare, Smartphone,
  BarChart2, Bell, FileText, Settings, Code, User, LogOut,
} from "lucide-react";

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtDuration(secs?: number) {
  if (!secs) return "--:--";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({
  onClose, onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const generateUploadUrl = useMutation(api.videos.generateUploadUrl);
  const saveVideo = useMutation(api.videos.saveVideo);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setUploading(true);
    setProgress(5);
    setError("");

    try {
      // 1. Get one-time upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      setProgress(10);

      // 2. Upload file directly to Convex storage
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(10 + Math.round((e.loaded / e.total) * 80));
        }
      };
      const uploadResult = await new Promise<{ storageId: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      setProgress(92);

      // 3. Get video duration via client-side
      const duration = await new Promise<number>((resolve) => {
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.onloadedmetadata = () => resolve(vid.duration);
        vid.onerror = () => resolve(0);
        vid.src = URL.createObjectURL(file);
      });

      // 4. Save metadata to Convex
      await saveVideo({
        name: file.name,
        storageId: uploadResult.storageId as any,
        size: file.size,
        duration: isFinite(duration) ? duration : undefined,
      });
      setProgress(100);
      setTimeout(() => { onSuccess(); onClose(); }, 600);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  }, [generateUploadUrl, saveVideo, onSuccess, onClose]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Upload Video</h2>
              <p className="text-gray-400 text-xs mt-0.5">MP4, MOV, AVI, MKV supported</p>
            </div>
          </div>
          {!uploading && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {uploading ? (
            // Upload progress view
            <div className="flex flex-col items-center py-6 gap-4">
              {progress < 100 ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Uploading...</span>
                      <span className="text-indigo-400 text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium">Upload complete!</p>
                </>
              )}
            </div>
          ) : (
            // Dropzone
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-indigo-400 bg-indigo-500/10"
                  : "border-gray-600 hover:border-gray-500 hover:bg-white/5"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center">
                <Film className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Drop your video here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Video Card ─────────────────────────────────────────────────────────────────
function VideoCard({
  video,
  onOpen,
  onDelete,
}: {
  video: any;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract first-frame thumbnail
  useEffect(() => {
    if (!video.playUrl) return;
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.muted = true;
    vid.preload = "metadata";
    vid.src = video.playUrl;
    vid.addEventListener("loadedmetadata", () => { vid.currentTime = 2; }, { once: true });
    vid.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(vid, 0, 0, 320, 180);
        setThumbUrl(canvas.toDataURL("image/jpeg", 0.7));
      }
    }, { once: true });
    vid.load();
  }, [video.playUrl]);

  return (
    <div
      className="group relative bg-[#111827] border border-gray-700/60 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-200"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-[#0d1526] relative overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt={video.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-10 h-10 text-gray-600" />
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-mono px-2 py-0.5 rounded-md backdrop-blur-sm">
            {fmtDuration(video.duration)}
          </div>
        )}
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{video.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {video.size ? (
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {fmtSize(video.size)}
                </span>
              ) : null}
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {fmtDate(video.createdAt)}
              </span>
            </div>
          </div>
          {/* Menu */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-36 bg-[#1f2937] border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onOpen(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Play className="w-4 h-4" /> Open in Editor
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaLibraryPage() {
  const router = useRouter();
  const videos = useQuery(api.videos.listVideos);
  const seedMaster = useMutation(api.videos.seedMasterVideo);
  const deleteVideo = useMutation(api.videos.deleteVideo);

  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const topNavItems = [
    { label: "Environments", icon: Home },
    { label: "Videos", icon: MonitorPlay, active: true },
    { label: "Digital Asset Management", icon: FolderCog },
    { label: "Live Stream", icon: Radio },
    { label: "Live Recording", icon: Video },
    { label: "V-Connect", icon: GitMerge },
    { label: "V-Routers", icon: Waypoints },
    { label: "Social Publish", icon: Share2 },
    { label: "AD Insertion", icon: PlaySquare },
    { label: "Portrait PRO", icon: Smartphone },
    { label: "Analytics", icon: BarChart2 },
    { label: "Advanced Video Analytics", icon: BarChart2 },
    { label: "Elections", icon: BarChart2 },
    { label: "Alerts", icon: Bell },
  ];

  const bottomNavItems = [
    { label: "Events & Logs", icon: FileText },
    { label: "Settings", icon: Settings },
    { label: "API Docs", icon: Code },
  ];

  // Seed master.mp4 on first load if it doesn't exist yet
  useEffect(() => {
    const masterUrl = process.env.NEXT_PUBLIC_VIDEO_URL ?? "/master.mp4";
    // Only seed if it's a real external URL (not local /master.mp4)
    if (masterUrl && masterUrl.startsWith("http")) {
      seedMaster({ url: masterUrl }).catch(() => {});
    }
  }, []);

  type VideoItem = NonNullable<typeof videos>[number];
  const filtered = (videos ?? []).filter((v: VideoItem) =>
    (v.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-sm">
      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* Sidebar */}
      <div className="w-[75px] flex-shrink-0 z-50">
        <div className="absolute top-0 left-0 h-full w-[75px] hover:w-[260px] transition-all duration-300 ease-in-out bg-[#0F0F23] flex flex-col items-stretch overflow-y-auto overflow-x-hidden border-r border-[#1a1a2e] scrollbar-hide py-4 group">
          <div className="flex-1 space-y-1 px-3 mt-4">
            {topNavItems.map((item, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer overflow-hidden ${
                  item.active
                    ? "bg-white/5 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 px-3 space-y-1">
            {bottomNavItems.map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center px-4 py-3 rounded text-left text-slate-400 hover:text-white hover:bg-white/5 overflow-hidden"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 px-3 space-y-1 pt-4 border-t border-white/10">
            <button className="w-full flex items-center px-4 py-3 rounded text-left text-slate-400 hover:text-white hover:bg-white/5 overflow-hidden">
              <User className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate whitespace-nowrap text-base font-medium ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Nikhil</span>
            </button>
            <button className="w-full flex items-center px-4 py-3 rounded text-left text-slate-500 hover:text-red-400 hover:bg-red-500/10 mt-1 overflow-hidden">
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate whitespace-nowrap text-base ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-semibold text-gray-700">Media Library</span>
            <span className="text-gray-400">· {(videos ?? []).length} videos</span>
          </div>
          <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 outline-none">
            <option>English</option>
          </select>
        </div>

        {/* Library Content */}
        <div className="flex-1 overflow-y-auto bg-[#0a0f1a] px-8 py-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#111827] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-64 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
            >
              <Plus className="w-4 h-4" />
              Upload Video
            </button>
          </div>

          {/* Grid */}
          {videos === undefined ? (
            // Loading
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111827] border border-gray-700/60 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[#1a2535]" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-gray-700 flex items-center justify-center">
                <Film className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">No videos yet</p>
                <p className="text-gray-500 text-sm mt-1">Upload a video to get started</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors mt-2"
              >
                <Upload className="w-4 h-4" />
                Upload your first video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((video: VideoItem) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onOpen={() => router.push(`/editor/${video._id}`)}
                  onDelete={() => deleteVideo({ id: video._id as any })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
