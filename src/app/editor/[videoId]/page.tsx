"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mockVideoStore, MockVideo } from "@/lib/mockStore";
import { VideoEditorProvider } from "@/contexts/VideoEditorContext";
import { TopNav } from "@/components/TopNav";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TimelineControls } from "@/components/TimelineControls";
import { TimelineScrubber } from "@/components/TimelineScrubber";
import { ClipsSidebar } from "@/components/ClipsSidebar";
import {
  Home, MonitorPlay, FolderCog, Video, Radio,
  GitMerge, Waypoints, Share2, PlaySquare, Smartphone,
  BarChart2, Bell, FileText, Settings, Code, User, LogOut, ArrowLeft,
} from "lucide-react";

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;
  const [activeTab, setActiveTab] = useState("Video Clips");
  const [video, setVideo] = useState<MockVideo | null | undefined>(undefined);

  useEffect(() => {
    setVideo(mockVideoStore.getById(videoId) ?? null);
  }, [videoId]);

  const topNavItems = [
    { label: "Environments", icon: Home },
    { label: "Videos", icon: MonitorPlay },
    { label: "Digital Asset Management", icon: FolderCog },
    { label: "Live Stream", icon: Radio },
    { label: "Live Recording", icon: Video },
    { label: "V-Connect", icon: GitMerge },
    { label: "V-Routers", icon: Waypoints, active: true },
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

  if (video === undefined) {
    return (
      <div className="flex h-screen w-full bg-[#0a0f1a] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (video === null) {
    return (
      <div className="flex h-screen w-full bg-[#0a0f1a] items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Video not found</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-sm">
      {/* Sidebar */}
      <div className="w-[75px] flex-shrink-0 z-50">
        <div className="absolute top-0 left-0 h-full w-[75px] hover:w-[260px] transition-all duration-300 ease-in-out bg-[#0F0F23] flex flex-col items-stretch overflow-y-auto overflow-x-hidden border-r border-[#1a1a2e] scrollbar-hide py-4 group">
          <div className="px-3 mb-4">
            <Link
              href="/"
              className="w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer text-indigo-400 hover:text-white hover:bg-indigo-500/20 overflow-hidden"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">Media Library</span>
            </Link>
          </div>
          <div className="flex-1 space-y-1 px-3 mt-4">
            {topNavItems.map((item, idx) => (
              <button key={idx} className={`w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer overflow-hidden ${item.active ? "bg-white/5 text-white font-medium shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 px-3 space-y-1">
            {bottomNavItems.map((item, idx) => (
              <button key={idx} className="w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 overflow-hidden">
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
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
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-700 transition-colors">Media Library</button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-700 truncate max-w-[300px]">{video.name}</span>
          </div>
          <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 outline-none">
            <option>English</option>
          </select>
        </div>

        <div className="flex-shrink-0 w-full relative shadow-sm z-0">
          <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="flex-1 flex overflow-hidden bg-gray-50 min-h-0">
          {activeTab === "Video Clips" ? (
            <VideoEditorProvider videoUrl={video.playUrl} videoId={videoId}>
              <div className="flex-1 flex flex-col p-4 w-full h-full min-h-0 border-r border-gray-200">
                <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-transparent relative rounded-lg overflow-hidden">
                  <div className="absolute inset-0">
                    <VideoPlayer />
                  </div>
                </div>
                <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-shrink-0">
                  <TimelineControls />
                  <TimelineScrubber />
                </div>
              </div>
              <div className="w-[380px] flex-shrink-0 bg-white relative z-10 flex flex-col">
                <ClipsSidebar />
              </div>
            </VideoEditorProvider>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600 mb-1">{activeTab}</h3>
                <p>Content for this tab has not been implemented yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
