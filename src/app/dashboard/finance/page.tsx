"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { 
  PlusIcon, 
  SearchIcon,
  ChevronDownIcon,
  PieChartIcon
} from "@/icons/index";

const MOCK_INVOICES = [
  { id: "1", number: "INV-2024-001", customer: "Ahmad Zaki", amount: 155000000, status: "paid", date: "2024-04-10" },
  { id: "2", number: "INV-2024-002", customer: "Sarah Johnson", amount: 250000000, status: "pending", date: "2024-04-12" },
  { id: "3", number: "INV-2024-003", customer: "Budi Santoso", amount: 75000000, status: "overdue", date: "2024-04-01" },
];

import { createBrowserClient } from "@supabase/ssr";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_collections: 0, pending_amount: 0, pending_count: 0 });
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
         console.error("Supabase Error Details:", error.message, error.details, error.hint);
         throw error;
      }
      setInvoices(data || []);
      
      // Calculate basic stats
      const total = data?.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) || 0;
      const pending = data?.filter(inv => inv.status !== 'paid').reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) || 0;
      const pCount = data?.filter(inv => inv.status !== 'paid').length || 0;
      
      setStats({
        total_collections: total,
        pending_amount: pending,
        pending_count: pCount
      });
    } catch (err: any) {
      console.error("Error fetching invoices:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* FINANCIAL OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-10 rounded-[48px] border-none shadow-2xl shadow-green-500/10 dark:shadow-none bg-white dark:bg-gray-900 overflow-hidden relative group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -right-12 -top-12 h-48 w-48 bg-green-500/5 rounded-full blur-[80px] group-hover:bg-green-500/10 transition-all duration-700"></div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-4 opacity-70">Total Collections</p>
          <h2 className="text-4xl font-normal text-gray-800 dark:text-white leading-none tracking-tighter">
            Rp {(stats.total_collections / 1000000).toFixed(1)}M
          </h2>
          <div className="mt-8 flex items-center gap-3">
            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-xl border border-green-100">Live Data</span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest opacity-60">from database</span>
          </div>
        </div>
        
        <div className="p-10 rounded-[48px] border-none shadow-2xl shadow-orange-500/10 dark:shadow-none bg-white dark:bg-gray-900 overflow-hidden relative group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -right-12 -top-12 h-48 w-48 bg-orange-500/5 rounded-full blur-[80px] group-hover:bg-orange-500/10 transition-all duration-700"></div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-4 opacity-70">Pending Invoices</p>
          <h2 className="text-4xl font-normal text-gray-800 dark:text-white leading-none tracking-tighter">
             Rp {(stats.pending_amount / 1000000).toFixed(1)}M
          </h2>
          <div className="mt-8 flex items-center gap-3 text-orange-500">
             <span className="icon-box bg-orange-50 dark:bg-orange-500/10 text-orange-600 border border-orange-100 dark:border-orange-500/20">
                <PieChartIcon />
             </span>
             <span className="text-[11px] font-bold tracking-tight opacity-80">{stats.pending_count} awaiting payment</span>
          </div>
        </div>

        <div className="p-10 rounded-[48px] border-none shadow-2xl shadow-brand-500/30 dark:shadow-none bg-gradient-to-br from-brand-600 to-purple-700 overflow-hidden relative group hover:-translate-y-2 transition-all duration-500">
          <div className="absolute -right-12 -top-12 h-48 w-48 bg-white/10 rounded-full blur-[80px]"></div>
          <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em] mb-4">Platform Revenue</p>
          <h2 className="text-4xl font-normal text-white leading-none tracking-tighter">Rp 0.0M</h2>
          <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white text-white hover:text-brand-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-[22px] transition-all border border-white/20 backdrop-blur-md shadow-xl">Withdraw Funds</button>
        </div>
      </div>

      <div className="rounded-[52px] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none overflow-hidden bg-white dark:bg-gray-900 relative">
        <div className="p-10 border-b border-gray-50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8 bg-gray-50/30 dark:bg-white/[0.01]">
           <div>
              <h1 className="text-3xl font-normal text-gray-800 dark:text-white tracking-tight leading-none">Billing Center</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black mt-4 opacity-70">Manage Invoices & Transaction Integrity</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group/search">
                 <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/search:text-brand-500 transition-colors" />
                 <input type="text" placeholder="Find an invoice..." className="w-72 bg-white dark:bg-white/5 border-none rounded-[20px] py-3.5 pl-12 pr-4 text-xs focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm font-medium" />
              </div>
              <button className="h-14 px-8 bg-brand-500 text-white rounded-[24px] flex items-center gap-3 text-[10px] uppercase font-black tracking-widest hover:bg-brand-600 transition-all shadow-2xl shadow-brand-500/20 hover:-translate-y-1">
                 <PlusIcon className="h-4 w-4" />
                 Create
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center p-20">
               <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <table className="w-full">
              <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/[0.01]">
                    <th className="px-10 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 text-left opacity-60">Identification</th>
                    <th className="px-10 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 text-left opacity-60">Customer</th>
                    <th className="px-10 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 text-right opacity-60">Balance</th>
                    <th className="px-10 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 text-center opacity-60">Status</th>
                    <th className="px-10 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 text-right opacity-60">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No invoices found</p>
                      </td>
                    </tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="group hover:bg-gray-100/30 dark:hover:bg-white/[0.01] transition-all duration-500">
                      <td className="px-10 py-8">
                          <span className="text-sm font-bold text-gray-800 dark:text-white mb-2 block tracking-tight">{inv.invoice_number}</span>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest opacity-60">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                      </td>
                      <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center border border-brand-100 dark:border-brand-500/20 shadow-sm group-hover:rotate-6 transition-all duration-500">
                                <span className="font-black text-xs">{inv.customers?.full_name?.charAt(0) || 'U'}</span>
                            </div>
                            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-bold tracking-tight">{inv.customers?.full_name || 'Unknown'}</span>
                          </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tighter">Rp {inv.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-10 py-8">
                          <div className="flex justify-center">
                            <Badge 
                              variant="light" 
                              color={
                                inv.status === 'paid' ? 'success' : 
                                inv.status === 'overdue' ? 'error' : 
                                'warning'
                              }
                              className="uppercase text-[9px] font-black tracking-[0.2em] px-4 py-1.5 rounded-full"
                            >
                              {inv.status}
                            </Badge>
                          </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                          <button className="h-10 px-6 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-brand-500 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all border border-gray-100 dark:border-transparent text-[9px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center">
                            Download
                          </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
