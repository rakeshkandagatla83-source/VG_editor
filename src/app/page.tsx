"use client";

import { TopNav } from "@/components/TopNav";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TimelineControls } from "@/components/TimelineControls";
import { TimelineScrubber } from "@/components/TimelineScrubber";
import { SegmentsBin } from "@/components/SegmentsBin";
import { ClipsSidebar } from "@/components/ClipsSidebar";
import { VideoEditorProvider } from "@/contexts/VideoEditorContext";
import { useState } from "react";
import { 
  Home, MonitorPlay, FolderCog, Video, Radio, 
  GitMerge, Waypoints, Share2, PlaySquare, Smartphone, 
  BarChart2, Bell, FileText, Settings, Code, User, LogOut, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

export default function VideoEditorPage() {
  const [activeTab, setActiveTab] = useState("Video Clips");

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

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-sm">
      {/* Sidebar Placeholder - ensures layout isn't pushed */}
      <div className="w-[75px] flex-shrink-0 z-50">
        {/* Actual Hover-Expanding Sidebar */}
        <div className="absolute top-0 left-0 h-full w-[75px] hover:w-[260px] transition-all duration-300 ease-in-out bg-[#0F0F23] flex flex-col items-stretch overflow-y-auto overflow-x-hidden border-r border-[#1a1a2e] scrollbar-hide py-4 group">
          
          <div className="flex-1 space-y-1 px-3 mt-4">
            {topNavItems.map((item, idx) => (
              <button 
                key={idx} 
                className={`w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer overflow-hidden ${
                  item.active 
                  ? 'bg-white/5 text-white font-medium shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 px-3 space-y-1">
            {bottomNavItems.map((item, idx) => (
              <button 
                key={idx} 
                className="w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 overflow-hidden"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 px-3 space-y-1 pt-4 border-t border-white/10">
            <button className="w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 overflow-hidden">
              <User className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate whitespace-nowrap text-base font-medium ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Nikhil</span>
            </button>
            <button className="w-full flex items-center px-4 py-3 rounded text-left transition-colors duration-200 cursor-pointer text-slate-500 hover:text-red-400 hover:bg-red-500/10 mt-1 overflow-hidden">
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate whitespace-nowrap text-base ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-semibold text-gray-700">Development</span>
            <span className="text-gray-400"> Scope</span>
          </div>
          <div>
            <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 outline-none">
              <option>English</option>
            </select>
          </div>
        </div>

        {/* Full Width Top Navigation (Tabs & Breadcrumbs) */}
        <div className="flex-shrink-0 w-full relative shadow-sm z-0">
          <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Dynamic Workspace based on Active Tab */}
        <div className="flex-1 flex overflow-hidden bg-gray-50 min-h-0">
          {activeTab === "Video Clips" ? (
            <VideoEditorProvider>
              {/* Left panel: Video + Timeline (Fits precisely into available height) */}
              <div className="flex-1 flex flex-col p-4 w-full h-full min-h-0 border-r border-gray-200">
                {/* Video container flexes to fill available space gracefully, shrinks if needed */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-transparent relative rounded-lg overflow-hidden">
                  <div className="absolute inset-0">
                    <VideoPlayer />
                  </div>
                </div>
                
                {/* Fixed bottom controls */}
                <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-shrink-0">
                  <TimelineControls />
                  <TimelineScrubber />
                  <SegmentsBin />
                </div>
              </div>

              {/* Right panel: Clips - now explicitly below the top nav */}
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
