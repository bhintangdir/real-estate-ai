"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { TrashBinIcon, ChevronLeftIcon, CheckCircleIcon, AlertIcon } from "@/icons";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Image from "next/image";

export default function RecycleBinPage() {
  const [deletedProperties, setDeletedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States untuk Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // States untuk Modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetProperty, setTargetProperty] = useState<{id: string, name: string, type: 'restore' | 'delete'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // State untuk Feedback (Theme consistent)
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({
     isOpen: false, type: 'success', message: ''
  });

  useEffect(() => {
    fetchDeletedProperties();
  }, []);

  const fetchDeletedProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select(`*, property_images!property_images_property_id_fkey (image_url, is_primary)`)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      setDeletedProperties(data || []);
    } catch (error: any) { console.error(error.message); } finally { setLoading(false); }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackModal({ isOpen: true, type, message });
  };

  const openModal = (id: string, name: string, type: 'restore' | 'delete') => {
    setTargetProperty({ id, name, type });
    setActionModalOpen(true);
  };

  const handleConfirmedAction = async () => {
    if (!targetProperty) return;
    setIsProcessing(true);
    try {
      if (targetProperty.type === 'restore') {
        const { error } = await supabase.from("properties").update({ deleted_at: null }).eq("id", targetProperty.id);
        if (error) throw error;
        showFeedback('success', `Property "${targetProperty.name}" restored successfully.`);
      } else {
        const { error } = await supabase.from("properties").delete().eq("id", targetProperty.id);
        if (error) throw error;
        showFeedback('success', `Property "${targetProperty.name}" purged permanently.`);
      }
      setActionModalOpen(false);
      fetchDeletedProperties();
    } catch (error: any) { 
       showFeedback('error', "Action failed: " + error.message);
    } finally {
      setIsProcessing(false);
      setTargetProperty(null);
    }
  };

  const filteredData = deletedProperties.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.listing_type === typeFilter;
    const matchesCity = cityFilter === "all" || item.city === cityFilter;
    return matchesSearch && matchesType && matchesCity;
  });

  const propertyTypes = ["all", ...new Set(deletedProperties.map(p => p.listing_type))];
  const cities = ["all", ...new Set(deletedProperties.map(p => p.city).filter(Boolean))];

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <PageBreadcrumb pageTitle="Recycle Bin" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* FILTER BAR */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border dark:border-gray-800 flex flex-col md:flex-row gap-4">
           <div className="flex-1">
              <Input type="text" placeholder="Search archives..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
           <div className="w-full md:w-48">
              <Select options={propertyTypes.map(t => ({ value: t, label: t === 'all' ? 'All Types' : t.toUpperCase() }))} value={typeFilter} onChange={setTypeFilter} />
           </div>
           <div className="w-full md:w-48">
              <Select options={cities.map(c => ({ value: c, label: c === 'all' ? 'All Cities' : c }))} value={cityFilter} onChange={setCityFilter} />
           </div>
        </div>

        <ComponentCard title={`${filteredData.length} Archived Units`}>
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Archived Unit</th>
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Market</th>
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Deleted Date</th>
                  <th className="px-5 py-4 text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center text-xs font-medium text-gray-400">Loading bin...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic font-medium text-xs tracking-widest">No matching records.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative h-11 w-11 grayscale rounded-xl overflow-hidden opacity-40 border dark:border-gray-800">
                            <Image src={item.property_images?.find((i:any)=>i.is_primary)?.image_url || "/images/properties/placeholder.jpg"} alt="P" fill className="object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-normal text-gray-500 line-through tracking-wide">{item.title}</p>
                            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{item.city || "Archive"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5"><Badge color="light" size="sm" className="uppercase text-[9px] font-medium px-2">{item.listing_type}</Badge></td>
                      <td className="px-5 py-5 text-[10px] font-medium text-gray-400 uppercase tracking-tight">{new Date(item.deleted_at).toLocaleDateString()}</td>
                      <td className="px-5 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                           {/* PROPER ICON SIZE (h-5) */}
                           <button onClick={() => openModal(item.id, item.title, 'restore')} className="flex items-center justify-center h-9 w-9 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500 transition-all rounded-xl border border-green-100 dark:border-green-500/20 shadow-sm" title="Restore"><CheckCircleIcon className="h-4 w-4" /></button>
                           <button onClick={() => openModal(item.id, item.title, 'delete')} className="flex items-center justify-center h-9 w-9 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 transition-all rounded-xl border border-red-100 dark:border-red-500/20 shadow-sm" title="Permanent Delete"><TrashBinIcon className="h-5 w-5" /></button>
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

      {/* DYNAMIC ACTION MODAL */}
      <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} className="max-w-[400px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 ${targetProperty?.type === 'restore' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
               {targetProperty?.type === 'restore' ? <CheckCircleIcon className="h-7 w-7 text-green-500"/> : <AlertIcon className="h-7 w-7 text-red-500"/>}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-3">{targetProperty?.type === 'restore' ? 'Restore Unit?' : 'Permeant Delete?'}</h3>
            <div className="flex w-full gap-3 mt-8">
               <button className="flex-1 h-11 text-[10px] text-gray-400 uppercase tracking-widest dark:border-gray-800 border rounded-xl hover:bg-gray-50 transition-colors font-medium" onClick={() => setActionModalOpen(false)} disabled={isProcessing}>Cancel</button>
               <button className={`flex-1 h-11 text-[10px] text-white uppercase tracking-widest rounded-xl transition-all font-medium ${targetProperty?.type === 'restore' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} onClick={handleConfirmedAction} disabled={isProcessing}>{isProcessing ? "Wait..." : "Confirm"}</button>
            </div>
         </div>
      </Modal>

      {/* FEEDBACK MODAL */}
      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="max-w-[350px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 ${feedbackModal.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
               {feedbackModal.type === 'success' ? <CheckCircleIcon className="h-7 w-7 text-green-500" /> : <AlertIcon className="h-7 w-7 text-red-500" />}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-2">{feedbackModal.type === 'success' ? 'Status Success' : 'Status Error'}</h3>
            <p className="text-xs text-gray-500 font-normal mb-8 leading-relaxed">{feedbackModal.message}</p>
            <button className="w-full h-11 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all" onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})}>Dismiss</button>
         </div>
      </Modal>
    </div>
  );
}
