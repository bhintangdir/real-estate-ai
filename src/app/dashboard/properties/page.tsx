"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { PlusIcon, TrashBinIcon, PencilIcon, AlertIcon, EyeIcon, CheckCircleIcon, GridIcon } from "@/icons";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Image from "next/image";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States untuk Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // States untuk Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State untuk Feedback (Replacement for alert)
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({
    isOpen: false, type: 'success', message: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select(`*, property_images!property_images_property_id_fkey (image_url, is_primary)`)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) { console.error(error.message); } finally { setLoading(false); }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackModal({ isOpen: true, type, message });
  };

  const openViewModal = (property: any) => {
    setSelectedProperty(property);
    setViewModalOpen(true);
  };

  const openDeleteModal = (id: string, name: string) => {
    setSelectedProperty({ id, title: name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProperty) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("properties").update({ deleted_at: new Date().toISOString() }).eq("id", selectedProperty.id);
      if (error) throw error;
      
      setDeleteModalOpen(false);
      showFeedback('success', `Property "${selectedProperty.title}" successfully moved to recycle bin.`);
      fetchProperties();
    } catch (error: any) { 
      showFeedback('error', "Failed to delete: " + error.message);
    } finally { 
      setIsDeleting(false); 
      setSelectedProperty(null); 
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  };

  // Logic Filtering
  const filteredData = properties.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.listing_type === typeFilter;
    const matchesCity = cityFilter === "all" || item.city === cityFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesType && matchesCity && matchesStatus;
  });

  const propertyTypes = ["all", ...new Set(properties.map(p => p.listing_type))];
  const cities = ["all", ...new Set(properties.map(p => p.city).filter(Boolean))];
  const statuses = ["all", "active", "pending", "sold", "rented"];
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter, cityFilter, statusFilter, pageSize]);

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <PageBreadcrumb pageTitle="Property Catalog" />
        <Link href="/dashboard/properties/add">
          <Button size="sm" startIcon={<PlusIcon />}>New Listing</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* FILTER BAR */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border dark:border-gray-800 flex flex-col lg:flex-row gap-4">
           <div className="flex-1">
              <Input type="text" placeholder="Search title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="w-full lg:w-40"><Select options={propertyTypes.map(t => ({ value: t, label: t === 'all' ? 'All Types' : t.toUpperCase() }))} value={typeFilter} onChange={setTypeFilter} /></div>
              <div className="w-full lg:w-40"><Select options={cities.map(c => ({ value: c, label: c === 'all' ? 'All Cities' : c }))} value={cityFilter} onChange={setCityFilter} /></div>
              <div className="w-full lg:w-40"><Select options={statuses.map(s => ({ value: s, label: s === 'all' ? 'Status' : s.toUpperCase() }))} value={statusFilter} onChange={setStatusFilter} /></div>
           </div>
        </div>

        <ComponentCard title={`${filteredData.length} Listings`}>
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Unit</th>
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Market</th>
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Price</th>
                  <th className="px-5 py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-5 py-4 text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest text-[10px]">Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-xs font-medium text-gray-400">Syncing...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No records.</td></tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="relative h-11 w-11 rounded-xl overflow-hidden border dark:border-gray-800 shadow-sm flex-shrink-0 bg-gray-50 dark:bg-white/5">
                             <Image 
                               src={
                                 item.main_image || 
                                 "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
                               } 
                               alt="P" 
                               fill 
                               className="object-cover" 
                             />
                          </div>
                          <div>
                            <p className="text-sm font-normal text-gray-800 dark:text-white/90">{item.title}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">{item.city || "Bali"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                         <Badge color="info" size="sm" className="uppercase text-[9px] font-medium tracking-tight px-1.5">{item.listing_type}</Badge>
                      </td>
                      <td className="px-5 py-4"><p className="text-sm font-normal text-brand-600 tracking-tight">{formatPrice(item.price)}</p></td>
                      <td className="px-5 py-4">
                        <Badge color={item.status === 'active' ? 'success' : 'warning'} variant="light" className="uppercase text-[9px] font-medium px-2">{item.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewModal(item)} className="flex items-center justify-center h-9 w-9 text-gray-400 bg-gray-50 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all border dark:border-gray-800"><EyeIcon className="h-5 w-5"/></button>
                          <Link 
                            href={item.slug ? `/dashboard/properties/${item.slug}` : '#'}
                            onClick={(e) => {
                              if (!item.slug) {
                                e.preventDefault();
                                showFeedback('error', 'Property missing slug. Please update in DB.');
                              }
                            }}
                          >
                            <button className="flex items-center justify-center h-9 w-9 text-brand-600 bg-brand-50 hover:bg-brand-500 hover:text-white dark:bg-brand-500/10 dark:hover:bg-brand-500 transition-all rounded-xl border border-brand-100 dark:border-brand-500/20 shadow-sm">
                              <PencilIcon className="h-5 w-5"/>
                            </button>
                          </Link>
                          <button onClick={() => openDeleteModal(item.id, item.title)} className="flex items-center justify-center h-9 w-9 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 transition-all rounded-xl border border-red-100 dark:border-red-500/20 shadow-sm"><TrashBinIcon className="h-5 w-5"/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="border-t dark:border-gray-800 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <p className="text-[9px] text-gray-400 uppercase font-medium tracking-widest">Show</p>
                <div className="w-20"><Select options={[5, 10, 25, 50].map(n => ({ value: n.toString(), label: n.toString() }))} value={pageSize.toString()} onChange={(v) => setPageSize(parseInt(v))} placement="top" /></div>
                <p className="text-[9px] text-gray-400 uppercase font-medium tracking-widest">per page</p>
             </div>
             <div className="flex items-center gap-1.5">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-2 text-[9px] uppercase tracking-widest font-medium text-gray-400 border rounded-lg hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 disabled:opacity-30 transition-colors">Prev</button>
                <div className="flex gap-1">
                   {[...Array(totalPages)].map((_, i) => (
                     <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-8 w-8 text-xs rounded-lg transition-all ${currentPage === i + 1 ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>{i + 1}</button>
                   ))}
                </div>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-2 text-[9px] uppercase tracking-widest font-medium text-gray-400 border rounded-lg hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 disabled:opacity-30 transition-colors">Next</button>
             </div>
          </div>
        </ComponentCard>
      </div>

      {/* VIEW MODAL (Compact) */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-xl w-full p-0">
         {selectedProperty && (
           <div className="flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border dark:border-gray-800">
              <div className="relative h-44">
                <Image 
                  src={
                    selectedProperty.main_image || 
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
                  } 
                  alt="P" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/60 p-6 flex flex-col justify-end h-full">
                   <p className="text-white/80 text-[8px] uppercase tracking-[0.2em] mb-1">{selectedProperty.listing_type} | {selectedProperty.city}</p>
                   <h2 className="text-lg font-normal text-white">{selectedProperty.title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.specifications && Object.entries(selectedProperty.specifications).map(([k,v]) => (<div key={k}><p className="text-[8px] text-gray-400 uppercase tracking-widest mb-1 font-medium">{k}</p><p className="text-xs font-normal text-gray-700 dark:text-gray-300">{String(v)}</p></div>))}
                 </div>
                 <div className="border-t dark:border-gray-800 pt-4"><p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-medium">Pricing</p><p className="text-xl font-normal text-brand-600">{formatPrice(selectedProperty.price)}</p></div>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-white/2 flex justify-end"><button onClick={() => setViewModalOpen(false)} className="px-6 py-2 text-[9px] text-gray-400 hover:text-gray-600 uppercase tracking-widest font-medium transition-colors">Close</button></div>
           </div>
         )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-[400px] p-8 text-center">
        <div className="flex flex-col items-center">
           <div className="h-14 w-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6"><AlertIcon className="h-7 w-7 text-red-500" /></div>
           <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-3">Delete Listing?</h3>
           <p className="text-xs text-gray-500 leading-relaxed mb-8 px-4 font-normal">Move unit to recycle bin?</p>
           <div className="flex w-full gap-3">
              <button disabled={isDeleting} className="flex-1 h-11 text-[10px] text-gray-400 uppercase tracking-widest border rounded-xl dark:border-gray-800 hover:bg-gray-50 transition-all font-medium" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
              <button disabled={isDeleting} className="flex-1 h-11 text-[10px] bg-red-600 text-white uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all font-medium" onClick={confirmDelete}>{isDeleting ? "Deleting..." : "Yes, Delete"}</button>
           </div>
        </div>
      </Modal>

      {/* THEME-CONSISTENT FEEDBACK MODAL (Success/Error) */}
      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="max-w-[350px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 ${feedbackModal.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
               {feedbackModal.type === 'success' ? <CheckCircleIcon className="h-7 w-7 text-green-500" /> : <AlertIcon className="h-7 w-7 text-red-500" />}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-2">{feedbackModal.type === 'success' ? 'Successful' : 'Operation Failed'}</h3>
            <p className="text-xs text-gray-500 font-normal leading-relaxed mb-8">{feedbackModal.message}</p>
            <button className="w-full h-11 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all hover:opacity-90" onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})}>Dismiss</button>
         </div>
      </Modal>
    </div>
  );
}
