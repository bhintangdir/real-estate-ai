"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { supabase } from "@/lib/supabase";
import { 
  TrashBinIcon as TrashBinIconRaw, 
  EyeIcon as EyeIconRaw,
  CheckCircleIcon as CheckCircleIconRaw,
  AlertIcon as AlertIconRaw,
  UserIcon as UserIconRaw,
  ChatIcon as ChatIconRaw,
  MailIcon as MailIconRaw,
  HorizontaLDots as HorizontaLDotsRaw,
  BoltIcon as BoltIconRaw,
  PlusIcon as PlusIconRaw,
  PencilIcon as PencilIconRaw,
  SearchIcon as SearchIconRaw,
  ShootingStarIcon as ShootingStarIconRaw,
  InfoIcon as InfoIconRaw
} from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

const TrashBinIcon = TrashBinIconRaw as any;
const EyeIcon = EyeIconRaw as any;
const CheckCircleIcon = CheckCircleIconRaw as any;
const AlertIcon = AlertIconRaw as any;
const UserIcon = UserIconRaw as any;
const ChatIcon = ChatIconRaw as any;
const MailIcon = MailIconRaw as any;
const MoreDots = HorizontaLDotsRaw as any;
const BoltIcon = BoltIconRaw as any;
const PlusIcon = PlusIconRaw as any;
const PencilIcon = PencilIconRaw as any;
const SearchIcon = SearchIconRaw as any;
const ShootingStarIcon = ShootingStarIconRaw as any;
const InfoIcon = InfoIconRaw as any;

const statusOptions = [
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Closed Won" },
  { value: "lost", label: "Lost" }
];

const priorityOptions = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" }
];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<any[] | null>(null);
  const [activeSearchMode, setActiveSearchMode] = useState<'standard' | 'ai'>('standard');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStep, setAiStep] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    priority: "medium",
    lead_status: "new",
    target_budget_min: "",
    target_budget_max: "",
    notes: ""
  });

  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({
     isOpen: false, type: 'success', message: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setSelectedCustomer(null);
    setFormData({
      full_name: "", email: "", phone: "", whatsapp_number: "",
      priority: "medium", lead_status: "new",
      target_budget_min: "", target_budget_max: "", notes: ""
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setFormMode('edit');
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      whatsapp_number: customer.whatsapp_number || "",
      priority: customer.priority || "medium",
      lead_status: customer.lead_status || "new",
      target_budget_min: customer.target_budget_min?.toString() || "",
      target_budget_max: customer.target_budget_max?.toString() || "",
      notes: customer.notes || ""
    });
    setIsFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        target_budget_min: formData.target_budget_min ? parseFloat(formData.target_budget_min) : null,
        target_budget_max: formData.target_budget_max ? parseFloat(formData.target_budget_max) : null,
        updated_at: new Date().toISOString()
      };

      if (formMode === 'add') {
        const { data: newCust, error } = await supabase.from("customers").insert([payload]).select().single();
        if (error) throw error;
        showFeedback('success', "New customer relationship established. AI is evaluating...");
        if (newCust) handleAiSync(newCust.id);
      } else {
        const { error } = await supabase.from("customers").update(payload).eq("id", selectedCustomer.id);
        if (error) throw error;
        showFeedback('success', "Customer information updated. Syncing AI...");
        handleAiSync(selectedCustomer.id);
      }
      setIsFormModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      showFeedback('error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase.from("customers").select("*");
      
      if (activeTab === 'active') {
        query = query.is("deleted_at", null);
      } else {
        query = query.not("deleted_at", "is", null);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setCustomers(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSync = async (id: string, silent = false) => {
    if (!silent) {
       setIsProcessing(true);
       setAiStep("Activating AI Brain...");
    }
    try {
      if (!silent) setAiStep("Generating Semantic Map...");
      const resp = await fetch("/api/customers/ai-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Sync failed");
      
      if (!silent) setAiStep("Analyzing Lead Potential...");
      
      if (data.success) {
        if (!silent) {
          setAiStep("Intelligence Synced!");
          setTimeout(() => setIsProcessing(false), 1000);
        }
        return data;
      }
    } catch (e: any) {
      console.error("AI Sync failed for ID:", id, e.message);
      if (!silent) {
        showFeedback('error', e.message);
        setIsProcessing(false);
      }
      throw e;
    }
  };

  const handleBulkSync = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    
    setAiStep(`Optimizing ${customers.length} Profiles...`);
    
    try {
      for (const cust of customers) {
        try {
          setAiStep(`Scanning: ${cust.full_name}`);
          await handleAiSync(cust.id, true);
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
      fetchCustomers();
      setAiStep("Database Fully Optimized");
      setTimeout(() => {
        setIsProcessing(false);
        showFeedback(failCount === 0 ? 'success' : 'error', 
          `Optimization Complete. Success: ${successCount}, Failed: ${failCount}`);
      }, 1500);
    } catch (e: any) {
      showFeedback('error', "Bulk sync abort: " + e.message);
      setIsProcessing(false);
    }
  };

  const performAiSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsAiSearching(true);
    try {
      const resp = await fetch("/api/customers/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm })
      });
      const data = await resp.json();
      if (data.success) {
        setAiSearchResults(data.results);
      }
    } catch (e) {
       showFeedback('error', "AI Search failed. Ensure you've run the SQL in migrations.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackModal({ isOpen: true, type, message });
  };

  const handleSoftDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      showFeedback('success', "Customer moved to Recycle Bin.");
      setDeleteModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      showFeedback('error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (id: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ deleted_at: null })
        .eq("id", id);
      
      if (error) throw error;
      showFeedback('success', "Customer restored successfully.");
      setRestoreModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      showFeedback('error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <PageBreadcrumb pageTitle={activeTab === 'active' ? "Customer Relations" : "Customer Recycle Bin"} />

      <div className="space-y-6">
        {/* TOP TOOLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
             <button 
               onClick={() => setActiveTab('active')}
               className={`flex-1 sm:px-6 py-2 text-[10px] uppercase font-medium tracking-widest rounded-lg transition-all ${activeTab === 'active' ? 'bg-white dark:bg-gray-800 shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Active Leads
             </button>
             <button 
               onClick={() => setActiveTab('deleted')}
               className={`flex-1 sm:px-6 py-2 text-[10px] uppercase font-medium tracking-widest rounded-lg transition-all ${activeTab === 'deleted' ? 'bg-white dark:bg-gray-800 shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Recycle Bin
             </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (activeSearchMode === 'ai') performAiSearch();
              }}
              className="relative w-full sm:w-80"
            >
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  {isAiSearching ? (
                    <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SearchIcon className={`h-4 w-4 ${activeSearchMode === 'ai' ? 'text-brand-600' : 'text-gray-400'}`} />
                  )}
               </div>
               <input 
                 type="text" 
                 placeholder={activeSearchMode === 'ai' ? "Ask AI: 'Cari villa 2M di Ubud'..." : "Search leads..."}
                 className={`w-full bg-white dark:bg-gray-900 border ${activeSearchMode === 'ai' ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-gray-200 dark:border-gray-800'} rounded-2xl py-2.5 pl-11 pr-32 text-sm focus:outline-none focus:border-brand-500 transition-all shadow-sm`}
                 value={searchTerm}
                 onChange={(e) => {
                   setSearchTerm(e.target.value);
                   if (e.target.value === "") setAiSearchResults(null);
                 }}
               />
               <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                        const newMode = activeSearchMode === 'standard' ? 'ai' : 'standard';
                        setActiveSearchMode(newMode);
                        if (newMode === 'standard') setAiSearchResults(null);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all ${activeSearchMode === 'ai' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700'}`}
                    title="Switch Search Mode"
                  >
                    <ShootingStarIcon className="h-3 w-3" />
                    {activeSearchMode === 'ai' ? 'Brain' : 'Std'}
                  </button>
                  {activeSearchMode === 'ai' && (
                    <button 
                      type="submit"
                      disabled={isAiSearching || !searchTerm.trim()}
                      className="h-7 w-7 bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <PlusIcon className="h-4 w-4 rotate-45" /> 
                    </button>
                  )}
               </div>
            </form>
            {activeTab === 'active' && activeSearchMode === 'standard' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleBulkSync}
                  disabled={isProcessing || customers.length === 0}
                  className="px-4 h-11 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 rounded-2xl flex items-center justify-center gap-2 text-[9px] uppercase font-bold tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                  title="Optimize database for AI Search"
                >
                  <ShootingStarIcon className="h-4 w-4" />
                  AI Optimization
                </button>
                <button 
                  onClick={handleOpenAdd}
                  className="px-6 h-11 bg-brand-500 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Lead
                </button>
              </div>
            )}
          </div>
        </div>

        <ComponentCard title={
            activeSearchMode === 'ai' && aiSearchResults 
            ? `AI Intelligence Found ${aiSearchResults.length} Prospects` 
            : (activeTab === 'active' ? "Connected Relationships" : "Archived Relationships")
          }>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b dark:border-gray-800">
                       <th className="px-5 py-4 text-[9px] uppercase tracking-[0.2em] font-medium text-gray-400">Customer</th>
                       <th className="px-5 py-4 text-[9px] uppercase tracking-[0.2em] font-medium text-gray-400">Contact</th>
                       <th className="px-5 py-4 text-[9px] uppercase tracking-[0.2em] font-medium text-gray-400 text-center">AI Score</th>
                       <th className="px-5 py-4 text-[9px] uppercase tracking-[0.2em] font-medium text-gray-400">Status</th>
                       <th className="px-5 py-4 text-[9px] uppercase tracking-[0.2em] font-medium text-gray-400 text-right">Actions</th>
                    </tr>
                 </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/2">
                    {loading ? (
                      <tr><td colSpan={5} className="py-20 text-center"><div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                    ) : (activeSearchMode === 'ai' ? (aiSearchResults || []) : filteredCustomers).length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-xs text-gray-400 uppercase tracking-widest">No matching customers found</td></tr>
                    ) : (
                      (activeSearchMode === 'ai' ? (aiSearchResults || []) : filteredCustomers).map((customer) => (
                        <tr key={customer.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                           <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border dark:border-brand-500/20 shadow-sm flex-shrink-0">
                                    <span className="text-xs font-semibold text-brand-600 uppercase">{customer.full_name?.charAt(0)}</span>
                                 </div>
                                 <div className="text-left">
                                    <div className="flex items-center gap-2">
                                       <p className="text-xs font-medium text-gray-800 dark:text-white leading-tight">{customer.full_name}</p>
                                       {customer.similarity && (
                                          <div className="px-1.5 py-0.5 bg-brand-500 text-white text-[8px] font-bold rounded-md uppercase tracking-tighter">
                                             {Math.round(customer.similarity * 100)}% Match
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className={`h-1.5 w-1.5 rounded-full ${customer.priority === 'high' ? 'bg-red-500' : (customer.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400')}`} />
                                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">{customer.priority} priority</p>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                 {customer.whatsapp_number && (
                                   <button className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 flex items-center justify-center border border-green-100 dark:border-green-500/20 hover:scale-110 transition-transform">
                                      <ChatIcon className="h-4 w-4" />
                                   </button>
                                 )}
                                 {customer.email && (
                                   <button className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 hover:scale-110 transition-transform">
                                      <MailIcon className="h-4 w-4" />
                                   </button>
                                 )}
                              </div>
                           </td>
                           <td className="px-5 py-4">
                              <div className="flex flex-col items-center">
                                 <div className="flex items-center gap-1">
                                    <BoltIcon className="h-4 w-4 text-brand-600" />
                                    <span className="text-xs font-semibold text-brand-600">{customer.lead_score || 0}</span>
                                    {customer.ai_score_reasoning && (
                                       <div className="group/tip relative ml-1">
                                          <InfoIcon className="h-3 w-3 text-gray-300 hover:text-brand-500 cursor-help" />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-[10px] text-white rounded-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all z-10 shadow-2xl leading-relaxed text-left border border-white/10">
                                             {customer.ai_score_reasoning}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                                 <div className="w-12 h-1 bg-gray-100 dark:bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                    <div className={`h-full ${customer.lead_score > 70 ? 'bg-green-500' : (customer.lead_score > 40 ? 'bg-brand-500' : 'bg-orange-500')} rounded-full`} style={{ width: `${Math.min(customer.lead_score || 0, 100)}%` }} />
                                 </div>
                              </div>
                           </td>
                           <td className="px-5 py-4">
                              <Badge color={customer.lead_status === 'won' ? 'success' : (customer.lead_status === 'lost' ? 'error' : 'info')} variant="light" size="sm" className="uppercase text-[9px] font-medium tracking-tight px-1.5">
                                 {customer.lead_status}
                              </Badge>
                           </td>
                           <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 {activeTab === 'active' ? (
                                   <>
                                      <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="h-8 w-8 flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all border dark:border-gray-800" title="View Profile"><EyeIcon className="h-4 w-4"/></button>
                                      
                                      <button 
                                        onClick={() => handleAiSync(customer.id)} 
                                        className="h-8 w-8 flex items-center justify-center text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white dark:bg-purple-500/10 dark:hover:bg-purple-500 transition-all rounded-lg border border-purple-100 dark:border-purple-500/20 shadow-sm"
                                        title="Magic AI Scan"
                                      >
                                        <ShootingStarIcon className="h-4 w-4" />
                                      </button>

                                      <button onClick={() => handleOpenEdit(customer)} className="h-8 w-8 flex items-center justify-center text-brand-600 bg-brand-50 hover:bg-brand-500 hover:text-white dark:bg-brand-500/10 dark:hover:bg-brand-500 transition-all rounded-lg border border-brand-100 dark:border-brand-500/20 shadow-sm" title="Edit Lead"><PencilIcon className="h-4 w-4"/></button>
                                      
                                      <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="h-8 w-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 transition-all rounded-lg border border-red-100 dark:border-red-500/20 shadow-sm" title="Archive"><TrashBinIcon className="h-4 w-4"/></button>
                                   </>
                                 ) : (
                                   <button onClick={() => { setSelectedCustomer(customer); setRestoreModalOpen(true); }} className="flex items-center gap-2 px-4 py-1.5 text-[9px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-lg hover:bg-brand-500 hover:text-white transition-all uppercase tracking-widest whitespace-nowrap">Restore</button>
                                 )}
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
           </div>
        </ComponentCard>
      </div>

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} className="max-w-2xl w-full p-8">
        <div className="mb-6">
           <h3 className="text-lg font-normal text-gray-800 dark:text-white">{formMode === 'add' ? 'Create New Relationship' : 'Refine Prospect Data'}</h3>
           <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mt-1">Capture detailed customer requirements and contact info</p>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Identity Name</label>
                 <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="e.g. John Doe" required />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Institutional Email</label>
                 <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" type="email" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Direct Phone</label>
                 <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+62..." />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">WhatsApp Number</label>
                 <Input value={formData.whatsapp_number} onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})} placeholder="+62..." />
              </div>
              
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Lead Status</label>
                 <Select 
                   options={statusOptions} 
                   value={formData.lead_status} 
                   onChange={(val) => setFormData({...formData, lead_status: val})} 
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Relationship Priority</label>
                 <Select 
                   options={priorityOptions} 
                   value={formData.priority} 
                   onChange={(val) => setFormData({...formData, priority: val})} 
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Budget Min</label>
                 <Input value={formData.target_budget_min} onChange={(e) => setFormData({...formData, target_budget_min: e.target.value})} placeholder="e.g. 500000" type="number" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Budget Max</label>
                 <Input value={formData.target_budget_max} onChange={(e) => setFormData({...formData, target_budget_max: e.target.value})} placeholder="e.g. 1000000" type="number" />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Internal Context & Notes</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-gray-50 dark:bg-white/5 border dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 min-h-[100px]"
                placeholder="Describe their specific property preferences, family size, or special requests..."
              />
           </div>

           <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-[10px] text-gray-400 uppercase tracking-widest font-bold hover:text-gray-600">Cancel</button>
              <button type="submit" disabled={isProcessing} className="px-8 py-2.5 bg-brand-500 text-white text-[10px] uppercase tracking-widest rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all">
                {isProcessing ? "Saving..." : (formMode === 'add' ? "Create Lead" : "Update Prospect")}
              </button>
           </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-xl w-full p-8">
         {selectedCustomer && (
           <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-16 w-16 rounded-3xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xl ring-4 ring-brand-50/50">
                      <span className="text-xl font-medium text-brand-600 uppercase">{selectedCustomer.full_name?.charAt(0)}</span>
                   </div>
                   <div>
                      <h2 className="text-lg font-normal text-gray-800 dark:text-white">{selectedCustomer.full_name}</h2>
                      <p className="text-xs text-gray-400 tracking-tight">{selectedCustomer.email || "No email provided"}</p>
                   </div>
                </div>
                <Badge color={selectedCustomer.priority === 'high' ? 'error' : (selectedCustomer.priority === 'medium' ? 'warning' : 'info')} variant="light" className="uppercase text-[9px] font-bold">
                   {selectedCustomer.priority} Priority
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                 <div><p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1 font-medium">Phone Number</p><p className="text-xs font-normal text-gray-700 dark:text-gray-300">{selectedCustomer.phone || "-"}</p></div>
                 <div><p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1 font-medium">WhatsApp</p><p className="text-xs font-normal text-gray-700 dark:text-gray-300">{selectedCustomer.whatsapp_number || "-"}</p></div>
                 <div><p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1 font-medium">Budget Target</p><p className="text-xs font-medium text-brand-600">{selectedCustomer.target_budget_min ? `$${selectedCustomer.target_budget_min.toLocaleString()} - $${selectedCustomer.target_budget_max.toLocaleString()}` : "Not specified"}</p></div>
                 <div><p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1 font-medium">Joined Date</p><p className="text-xs font-normal text-gray-700 dark:text-gray-300">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p></div>
              </div>

              <div className="pt-6 border-t dark:border-gray-800">
                 <p className="text-[8px] text-gray-400 uppercase tracking-widest mb-2 font-medium">AI Agent Insights</p>
                 <div className="p-4 bg-gray-50 dark:bg-white/2 rounded-2xl border dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">{selectedCustomer.ai_score_reasoning || "Agent is still analyzing this profile..."}</p>
                 </div>
              </div>

              <div className="flex justify-end pt-4"><button onClick={() => setViewModalOpen(false)} className="px-6 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all hover:opacity-90">Close</button></div>
           </div>
         )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-[400px] p-8 text-center">
        <div className="flex flex-col items-center">
           <div className="h-14 w-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6"><AlertIcon className="h-7 w-7 text-red-500" /></div>
           <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-3">Archive Customer?</h3>
           <p className="text-xs text-gray-500 leading-relaxed mb-8 px-4 font-normal">Moving <span className="text-gray-900 dark:text-white font-medium">{selectedCustomer?.full_name}</span> to recycle bin. You can restore them later.</p>
           <div className="flex w-full gap-3">
              <button disabled={isProcessing} className="flex-1 h-11 text-[10px] text-gray-400 uppercase tracking-widest border rounded-xl dark:border-gray-800 hover:bg-gray-50 transition-all font-medium" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
              <button disabled={isProcessing} className="flex-1 h-11 text-[10px] bg-red-600 text-white uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all font-medium" onClick={() => handleSoftDelete(selectedCustomer?.id)}>{isProcessing ? "Processing..." : "Archive List"}</button>
           </div>
        </div>
      </Modal>

      {/* RESTORE MODAL */}
      <Modal isOpen={restoreModalOpen} onClose={() => setRestoreModalOpen(false)} className="max-w-[400px] p-8 text-center">
        <div className="flex flex-col items-center">
           <div className="h-14 w-14 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center mb-6"><div className="h-7 w-7 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" hidden={!isProcessing} /><UserIcon className="h-7 w-7 text-brand-600" hidden={isProcessing} /></div>
           <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-3">Restore Customer?</h3>
           <p className="text-xs text-gray-500 leading-relaxed mb-8 px-4 font-normal">Bring <span className="text-gray-900 dark:text-white font-medium">{selectedCustomer?.full_name}</span> back to the active relationship list?</p>
           <div className="flex w-full gap-3">
              <button disabled={isProcessing} className="flex-1 h-11 text-[10px] text-gray-400 uppercase tracking-widest border rounded-xl dark:border-gray-800 hover:bg-gray-50 transition-all font-medium" onClick={() => setRestoreModalOpen(false)}>Cancel</button>
              <button disabled={isProcessing} className="flex-1 h-11 text-[10px] bg-brand-600 text-white uppercase tracking-widest rounded-xl hover:bg-brand-500 transition-all font-medium" onClick={() => handleRestore(selectedCustomer?.id)}>{isProcessing ? "Restoring..." : "Restore Now"}</button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="max-w-[350px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 shadow-sm ${feedbackModal.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
               {feedbackModal.type === 'success' ? <CheckCircleIcon className="h-7 w-7 text-green-500" /> : <AlertIcon className="h-7 w-7 text-red-500" />}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-2">{feedbackModal.type === 'success' ? 'Bravo!' : 'System Error'}</h3>
            <p className="text-xs text-gray-500 font-normal leading-relaxed mb-8">{feedbackModal.message}</p>
            <button className="w-full h-11 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all hover:opacity-90" onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})}>Understood</button>
         </div>
      </Modal>

      {/* PREMIUM AI PROCESSING OVERLAY */}
      {isProcessing && aiStep && (
         <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-500"></div>
            <div className="relative bg-white dark:bg-gray-900 border dark:border-white/10 p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center overflow-hidden scale-in-center transition-all">
               {/* Animated Background Glow */}
               <div className="absolute -top-24 -left-24 h-48 w-48 bg-brand-500/20 rounded-full blur-[80px] animate-pulse"></div>
               <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-purple-500/20 rounded-full blur-[80px] animate-pulse delay-700"></div>
               
               <div className="relative z-10">
                  <div className="relative h-20 w-20 mx-auto mb-8">
                     <div className="absolute inset-0 rounded-3xl bg-brand-500/10 border-2 border-brand-500/20 animate-spin-slow"></div>
                     <div className="absolute inset-4 rounded-2xl bg-brand-500 shadow-[0_0_20px_rgba(78,70,229,0.5)] flex items-center justify-center">
                        <ShootingStarIcon className="h-8 w-8 text-white animate-bounce-gentle" />
                     </div>
                  </div>
                  
                  <h3 className="text-xl font-normal text-gray-800 dark:text-white mb-2 tracking-tight">AI Brain Processing</h3>
                  <div className="flex flex-col items-center gap-4">
                     <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.2em] animate-pulse">{aiStep}</p>
                     
                     <div className="w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 animate-progress-indefinite"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
