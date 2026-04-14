"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { 
  PlusIcon, 
  CalenderIcon,
  SearchIcon,
  ChevronDownIcon,
  UserCircleIcon,
  PieChartIcon
} from "@/icons/index";

const MOCK_SURVEYS = [
  { id: "1", customer: "Ahmad Zaki", property: "Villa Sanctuary Ubud", date: "2024-04-15", time: "10:00 AM", status: "scheduled" },
  { id: "2", customer: "Sarah Johnson", property: "Penthouse Sanur Heights", date: "2024-04-16", time: "02:30 PM", status: "scheduled" },
  { id: "3", customer: "Budi Santoso", property: "Cliffside Mansion Uluwatu", date: "2024-04-12", time: "09:00 AM", status: "completed" },
];

import { createBrowserClient } from "@supabase/ssr";

export default function SurveysPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_schedules')
        .select(`
          *,
          customers(full_name),
          properties(title)
        `)
        .order('scheduled_at', { ascending: true });

      if (error) {
         console.error("Supabase Error Details:", error.message, error.details, error.hint);
         throw error;
      }
      setSurveys(data || []);
    } catch (err: any) {
      console.error("Error fetching surveys:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  // Simple logic to get days in month for the calendar
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const calendarDays = [];
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // Fill empty days for previous month
  for (let i = 0; i < firstDayOfMonth(year, month); i++) {
    calendarDays.push(null);
  }
  
  // Fill actual days
  for (let i = 1; i <= daysInMonth(year, month); i++) {
    calendarDays.push(i);
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* OPERATIONS HEADER */}
      <div className="flex flex-col lg:row md:flex-row md:items-center justify-between gap-8 bg-white/40 dark:bg-white/[0.02] p-8 rounded-[40px] border border-gray-100 dark:border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-normal text-gray-800 dark:text-white tracking-tight leading-none">Logistics Center</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black mt-4 opacity-70">Field Inspections & Property Intelligence</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
            className={`h-14 px-8 border rounded-[24px] flex items-center gap-4 text-[10px] uppercase font-black tracking-widest transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 ${
              view === 'calendar' 
              ? 'bg-brand-500 text-white border-brand-500 shadow-brand-500/20' 
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300'
            }`}
          >
             <span className={`icon-box ${view === 'calendar' ? 'bg-white/20 text-white border-white/20' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 border-brand-100 dark:border-brand-500/20'}`}>
                <CalenderIcon />
             </span>
             {view === 'calendar' ? 'List View' : 'Calendar'}
          </button>
          <button className="h-14 px-8 bg-brand-500 text-white rounded-[24px] flex items-center gap-3 text-[10px] uppercase font-black tracking-widest hover:bg-brand-600 transition-all shadow-2xl shadow-brand-500/30 hover:-translate-y-1">
             <PlusIcon className="h-4 w-4" />
             New Survey
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* SURVEYS LIST */}
          <div className="lg:col-span-2 space-y-6">
            {surveys.length === 0 ? (
               <div className="p-20 text-center bg-gray-50 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-gray-200 dark:border-white/5">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No surveys scheduled yet</p>
               </div>
            ) : surveys.map((survey) => (
              <div key={survey.id} className="rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none bg-white dark:bg-gray-900 overflow-hidden hover:scale-[1.02] transition-all duration-500 group relative">
                <div className="flex items-stretch h-full">
                   <div className={`w-3 flex-shrink-0 transition-all duration-500 group-hover:w-4 ${survey.status === 'scheduled' ? 'bg-gradient-to-b from-brand-400 to-brand-600' : 'bg-gradient-to-b from-green-400 to-green-600'}`}></div>
                   <div className="flex-1 p-8 flex items-center justify-between gap-6 overflow-hidden">
                      <div className="flex items-center gap-8 overflow-hidden">
                         <div className="text-center min-w-[70px] flex-shrink-0">
                            <p className="text-[11px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">
                               {new Date(survey.scheduled_at).toLocaleString('default', { month: 'short' })}
                            </p>
                            <p className="text-3xl font-normal text-gray-800 dark:text-white leading-none tracking-tighter">
                               {new Date(survey.scheduled_at).getDate()}
                            </p>
                         </div>
                         
                         <div className="h-12 w-px bg-gray-100 dark:border-white/5 flex-shrink-0"></div>
                         
                         <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight truncate tracking-tight">
                               {survey.properties?.title || 'Unknown Property'}
                            </h3>
                            <div className="flex items-center gap-6 mt-4">
                               <div className="flex items-center gap-3">
                                  <span className="icon-box bg-green-50 dark:bg-green-500/10 text-green-600 border border-green-100 dark:border-green-500/20 hover:scale-110 transition-transform">
                                     <UserCircleIcon />
                                  </span>
                                  <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                                     {survey.customers?.full_name || 'No Customer'}
                                  </span>
                               </div>
                               <span className="text-gray-200 dark:text-white/5 font-thin tracking-widest text-xl">/</span>
                               <div className="flex items-center gap-3">
                                  <span className="icon-box bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100 dark:border-blue-500/20 hover:scale-110 transition-transform">
                                     <CalenderIcon />
                                  </span>
                                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 opacity-80">
                                     {new Date(survey.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-shrink-0">
                         <Badge variant="light" color={survey.status === 'scheduled' ? 'info' : 'success'} className="uppercase text-[10px] font-black tracking-widest px-4 py-1">
                            {survey.status}
                         </Badge>
                         <span className="icon-box bg-gray-50 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-400 border border-gray-200 dark:border-gray-800 cursor-pointer shadow-sm hover:rotate-90 transition-all duration-500 !rounded-xl">
                            <PlusIcon />
                         </span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-8">
            <div className="p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none bg-white dark:bg-gray-900 border dark:border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <div className="icon-box !h-32 !w-32 !bg-transparent border-none">
                     <PieChartIcon className="rotate-12" />
                  </div>
               </div>
               <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-[0.3em] mb-10 opacity-70">Capacity Trends</h3>
               <div className="space-y-10">
                  <div>
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Global Schedule</span>
                        <span className="text-sm font-black text-brand-600">85%</span>
                     </div>
                     <div className="w-full h-2.5 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-transparent cursor-help">
                        <div className="h-full bg-gradient-to-r from-brand-400 to-purple-600 rounded-full shadow-[0_0_8px_rgba(109,40,217,0.3)] animate-pulse" style={{ width: '85%' }}></div>
                     </div>
                  </div>
                  
                  <div className="p-6 bg-brand-50 dark:bg-brand-500/10 rounded-[28px] border border-brand-100 dark:border-brand-500/20 relative">
                     <p className="text-[11px] text-brand-700 dark:text-brand-400 font-bold leading-relaxed tracking-tight">AI Insights: Property inspections in Ubud are up by 40% this week. Consider prioritizing agents to the south.</p>
                  </div>
               </div>
            </div>

            <div className="p-12 rounded-[52px] border-none shadow-2xl shadow-brand-500/20 dark:shadow-none bg-gradient-to-br from-brand-600 to-purple-700 overflow-hidden relative group">
               <div className="absolute -right-16 -top-16 h-48 w-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-1000"></div>
               <div className="absolute -left-16 -bottom-16 h-48 w-48 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-125 transition-all duration-1000"></div>
               
               <div className="relative z-10 text-center">
                  <div className="h-16 w-16 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl scale-110">
                     <div className="icon-box !h-10 !w-10 !bg-transparent border-none">
                        <UserCircleIcon className="text-white" />
                     </div>
                  </div>
                  <h3 className="text-white text-2xl font-normal mb-3 tracking-tight">Need Support?</h3>
                  <p className="text-white/60 text-[11px] uppercase font-bold tracking-[0.25em] mb-10 leading-relaxed max-w-[200px] mx-auto">Manual agent assignment for complex inspections</p>
                  <button className="w-full py-5 bg-white text-brand-600 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-2xl shadow-black/20 active:scale-95">Assign Agent</button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="bg-white dark:bg-gray-900 rounded-[50px] border border-gray-100 dark:border-white/5 shadow-2xl p-10 animate-in zoom-in duration-700">
           <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-normal text-gray-800 dark:text-white tracking-tight">
                 {monthNames[month]} <span className="font-bold text-brand-500 opacity-60 ml-2">{year}</span>
              </h2>
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 font-bold text-gray-400">&lt;</button>
                 <button onClick={() => setCurrentMonth(new Date())} className="px-5 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">Today</button>
                 <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 font-bold text-gray-400">&gt;</button>
              </div>
           </div>
           
           <div className="grid grid-cols-7 gap-6">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 pt-2 pb-6">{day}</div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const surveysToday = day ? surveys.filter(s => {
                    const d = new Date(s.survey_date);
                    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                }) : [];
                
                return (
                  <div key={idx} className={`aspect-[1.5/1] p-4 rounded-[28px] border transition-all duration-500 relative group overflow-hidden ${
                    day 
                    ? 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:-translate-y-1' 
                    : 'bg-transparent border-transparent'
                  }`}>
                    {day && (
                      <>
                        <span className={`text-sm font-bold ${day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? 'text-brand-500' : 'text-gray-400'}`}>{day}</span>
                        <div className="mt-2 space-y-1.5 overflow-hidden">
                          {surveysToday.map(s => (
                            <div key={s.id} className="h-1.5 w-1.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(109,40,217,0.5)] animate-pulse"></div>
                          ))}
                        </div>
                        {surveysToday.length > 0 && (
                          <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/[0.03] transition-colors pointer-events-none"></div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      )}

    </div>
  );
}
