"use client";

import { ChevronRight, Edit } from "lucide-react";

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const tabs = [
    "Overview",
    "Video Clips",
    "SCTE Insertion",
    "Ad Insertions",
    "Subtitles",
    "Metadata",
    "Social Publish",
    "AI Analysis",
    "AI Analysis 2",
    "Video Editor",
    "Portrait Pro Editor",
  ];

  return (
    <div className="flex flex-col w-full border-b border-gray-200 bg-white pt-2">
      <div className="flex items-center justify-between px-6 pb-2">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500 font-medium cursor-pointer hover:text-gray-900 transition-colors duration-200">Video List</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900 cursor-pointer">FULL_MATCH_Portugal_v_Spain_2018_FIFA_World_Cup</span>
          <button className="flex items-center ml-4 text-gray-500 hover:text-gray-900 space-x-1 text-xs cursor-pointer transition-colors duration-200">
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
        <div className="flex items-center">
          <select className="text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none text-gray-700 cursor-pointer hover:border-gray-300 transition-colors duration-200">
            <option>English</option>
          </select>
        </div>
      </div>
      
      <div className="flex px-6 space-x-6 overflow-x-auto scrollbar-hide text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`whitespace-nowrap pb-3 border-b-2 transition-all duration-200 cursor-pointer ${
              tab === activeTab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
