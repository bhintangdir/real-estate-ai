"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import ComponentCard from "@/components/common/ComponentCard";
import { 
  SearchIcon, 
  ChatIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  PlusIcon
} from "@/icons/index";

// Mock Data for UI demonstration
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    customer_name: "Ahmad Zaki",
    channel: "whatsapp",
    last_message: "Boleh kirimkan detail unit Villa di Ubud?",
    time: "10:25 AM",
    unread_count: 2,
    avatar: null,
    status: "online"
  },
  {
    id: "2",
    customer_name: "Sarah Johnson",
    channel: "telegram",
    last_message: "Great! Let me discuss this with my team.",
    time: "Yesterday",
    unread_count: 0,
    avatar: null,
    status: "offline"
  },
  {
    id: "3",
    customer_name: "Budi Santoso",
    channel: "whatsapp",
    last_message: "Terima kasih infonya.",
    time: "Monday",
    unread_count: 0,
    avatar: null,
    status: "offline"
  }
];

const MOCK_MESSAGES = [
  { id: "1", type: "customer", content: "Halo, saya tertarik dengan Villa di Sanur.", time: "09:00 AM" },
  { id: "2", type: "staff", content: "Halo Pak Ahmad! Tentu, kami punya beberapa unit premium di sana. Ada spesifikasi khusus?", time: "09:05 AM" },
  { id: "3", type: "customer", content: "Boleh kirimkan detail unit Villa di Ubud?", time: "10:25 AM" },
];

export default function InboxPage() {
  const [selectedConv, setSelectedConv] = useState(MOCK_CONVERSATIONS[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* CONVERSATION LIST (LEFT PANE) */}
      <div className="w-[400px] flex flex-col gap-4 h-full">
        <div className="flex-1 flex flex-col overflow-hidden rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative group">
          <div className="p-8 border-b border-gray-100 dark:border-white/5 relative z-10">
            <h1 className="text-2xl font-normal text-gray-800 dark:text-white tracking-tight">Omnichannel Inbox</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mt-2 leading-relaxed">AI-Powered Command Center</p>
            
            <div className="relative mt-8 group/search">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/search:text-brand-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Find a conversation..." 
                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-[20px] py-3.5 pl-12 pr-4 text-xs focus:ring-4 focus:ring-brand-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 mt-2">
            {MOCK_CONVERSATIONS.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full p-5 rounded-[28px] flex items-center gap-4 transition-all duration-500 group relative ${selectedConv.id === conv.id ? 'bg-white dark:bg-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-white/5 scale-[1.02] z-10' : 'hover:bg-gray-50/80 dark:hover:bg-white/2'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base relative overflow-hidden transition-all duration-500 ${selectedConv.id === conv.id ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 border border-brand-100 dark:border-brand-500/20'}`}>
                    {conv.customer_name.charAt(0)}
                  </div>
                  
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-white/10 flex items-center justify-center p-1">
                    {conv.channel === 'whatsapp' ? (
                      <div className="bg-green-500 h-full w-full rounded-[3px] flex items-center justify-center">
                        <span className="text-[7px] text-white font-black">W</span>
                      </div>
                    ) : (
                      <div className="bg-blue-400 h-full w-full rounded-[3px] flex items-center justify-center">
                        <span className="text-[7px] text-white font-black">T</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-xs font-semibold truncate ${selectedConv.id === conv.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{conv.customer_name}</p>
                    <span className="text-[9px] text-gray-400 font-medium">{conv.time}</span>
                  </div>
                  <p className="text-[10px] truncate leading-relaxed text-gray-400 font-medium">{conv.last_message}</p>
                </div>

                {conv.unread_count > 0 && selectedConv.id !== conv.id && (
                  <div className="h-4 min-w-[16px] px-1 bg-brand-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20">
                    {conv.unread_count}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT WINDOW (RIGHT PANE) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none bg-white dark:bg-gray-900 border dark:border-white/5 relative">
          
          {/* Chat Header */}
          <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl z-20">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-[14px] bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 font-black text-sm">
                {selectedConv.customer_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-gray-800 dark:text-white leading-none tracking-tight truncate">{selectedConv.customer_name}</h2>
                <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                   <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${selectedConv.channel === 'whatsapp' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {selectedConv.channel}
                   </div>
                   <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate opacity-60">Verified Identity</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button className="h-9 px-5 rounded-xl bg-white dark:bg-white/5 text-gray-500 hover:text-brand-500 hover:shadow-sm transition-all text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/5">View Profile</button>
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 border border-brand-100 dark:border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all cursor-pointer shadow-sm">
                <PlusIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95 dark:opacity-40">
            <div className="flex justify-center sticky top-0 z-10">
              <span className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] rounded-xl shadow-sm border border-gray-100 dark:border-white/5">Today</span>
            </div>

            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'staff' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`max-w-[80%] group relative`}>
                  <div className={`px-5 py-3 rounded-[24px] text-[12px] leading-relaxed shadow-lg ${
                    msg.type === 'staff' 
                    ? 'bg-gradient-to-br from-brand-600 to-purple-700 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-50 dark:border-white/5 shadow-gray-200/20 shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 p-0.5 ${msg.type === 'staff' ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter opacity-50">
                      {msg.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl border-t border-gray-100 dark:border-white/5 relative z-20">
            <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-white/[0.03] p-1.5 pl-4 rounded-[20px] border border-gray-100 dark:border-white/5 focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all shadow-inner">
              <textarea 
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Reply to ${selectedConv.customer_name}...`}
                className="flex-1 bg-transparent border-none py-2 text-[13px] focus:ring-0 resize-none max-h-32 dark:text-white font-medium"
              />

              <div className="flex items-center gap-1">
                <div className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-all cursor-pointer">
                  <PlusIcon className="h-4 w-4 rotate-45" />
                </div>
                <button 
                  className="h-8 px-5 bg-brand-500 text-white rounded-[14px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex-shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Press ↵ to send</p>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="h-1 w-1 bg-brand-500 rounded-full animate-pulse"></div>
                 <p className="text-[9px] text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest">AI Sync</p>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
