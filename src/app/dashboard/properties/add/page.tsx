"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { supabase } from "@/lib/supabase";
import { 
  GridIcon as GridIconRaw, 
  TrashBinIcon as TrashBinIconRaw, 
  PlusIcon as PlusIconRaw, 
  ShootingStarIcon as ShootingStarIconRaw, 
  CheckCircleIcon as CheckCircleIconRaw, 
  AlertIcon as AlertIconRaw,
  LockIcon as LockIconRaw,
  BoltIcon as BoltIconRaw,
  EyeIcon as EyeIconRaw,
  BoxIcon as BoxIconRaw 
} from "@/icons";
import { generatePropertyMarketing } from "@/lib/gemini";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";

const GridIcon = GridIconRaw as any;
const TrashBinIcon = TrashBinIconRaw as any;
const PlusIcon = PlusIconRaw as any;
const ShootingStarIcon = ShootingStarIconRaw as any;
const CheckCircleIcon = CheckCircleIconRaw as any;
const AlertIcon = AlertIconRaw as any;
const LockIcon = LockIconRaw as any;
const BoltIcon = BoltIconRaw as any;
const EyeIcon = EyeIconRaw as any;
const BoxIcon = BoxIconRaw as any;

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [dynamicSpecs, setDynamicSpecs] = useState<{ key: string; value: string }[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    listing_type: "sale",
    description: "",
    price: "",
    currency: "IDR",
    location: "",
    city: "",
    address: "",
    status: "active",
    amenities: [] as string[],
    seo_title: "",
    social_caption: ""
  });

  const AMENITIES_LIST = [
    "Swimming Pool", "Garden", "WiFi", "Parking", "Air Conditioning", 
    "Security 24/7", "Fully Furnished", "Ocean View", "Gym", "Kitchen"
  ];

  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, type: 'success' | 'warning' | 'error', message: string}>({
    isOpen: false, type: 'success', message: ''
  });

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from("property_categories").select("*").order("name");
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
     setFeedbackModal({ isOpen: true, type, message });
  };

  const formatNumber = (val: string) => val ? val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

  const validateForAi = () => {
    const missing = [];
    if (!formData.title) missing.push("Title");
    if (!formData.price) missing.push("Price");
    if (!formData.city) missing.push("City");
    if (dynamicSpecs.length < 2) missing.push("min. 2 Specs");
    if (missing.length > 0) {
      showFeedback('warning', `AI needs more context. Please fill in: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleAiWriter = async (field: 'description' | 'marketing') => {
    if (!validateForAi()) return;
    setAiLoading(true);
    try {
      const specObject: Record<string, string> = {};
      dynamicSpecs.forEach(s => { if(s.key) specObject[s.key] = s.value; });
      const catName = categories.find(c => c.id.toString() === formData.category_id)?.name || "Property";

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, category_name: catName, specifications: specObject })
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "AI Sync failed");
      }
      
      if (res) {
        if (field === 'description') {
           setFormData(prev => ({ ...prev, description: res.description }));
           showFeedback('success', "AI Magic complete! A narrative-driven story has been written for your listing.");
        } else {
           setFormData(prev => ({ ...prev, seo_title: res.seo_title, social_caption: res.social_caption }));
           showFeedback('success', "SEO & Social Media strategy has been updated via AI Magic.");
        }
      }
    } catch (e: any) { showFeedback('error', e.message || "AI Magic Sync failed."); } finally { setAiLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const specObject: Record<string, string> = {};
      dynamicSpecs.forEach(s => { if(s.key) specObject[s.key] = s.value; });
      const numericPrice = parseFloat(formData.price.replace(/,/g, ""));

      const { data: { user } } = await supabase.auth.getUser();

      const { data: prop, error } = await supabase.from("properties").insert({
        title: formData.title, 
        category_id: parseInt(formData.category_id), 
        listing_type: formData.listing_type,
        description: formData.description, 
        price: numericPrice, 
        location: formData.location,
        city: formData.city, 
        address: formData.address,
        status: formData.status,
        amenities: formData.amenities, 
        specifications: specObject,
        agent_id: user?.id,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7),
        marketing_copy: { seo_title: formData.seo_title || formData.title, social_caption: formData.social_caption }
      }).select().single();

      if (error) throw error;

      if (images.length > 0 && prop) {
        const uploadPromises = images.map(async (img, idx) => {
          const fileName = `${prop.id}-${idx + 1}-${Date.now()}.${img.file.name.split('.').pop()}`;
          const filePath = `${prop.id}/${fileName}`;
          await supabase.storage.from("properties").upload(filePath, img.file, { upsert: true });
          const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(filePath);
          return { property_id: prop.id, image_url: publicUrl, is_primary: idx === 0 };
        });
        const imageData = await Promise.all(uploadPromises);
        await supabase.from("property_images").insert(imageData);

        // Update main_image reference in property table for faster catalog loading
        const primaryImage = imageData.find(img => img.is_primary)?.image_url || imageData[0]?.image_url;
        if (primaryImage) {
          await supabase.from("properties").update({ main_image: primaryImage }).eq("id", prop.id);
        }
      }
      router.push("/dashboard/properties");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <PageBreadcrumb pageTitle="New Property Listing" />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard title="General Identity">
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Market</Label><Select options={[{label:"Sale",value:"sale"},{label:"Rent",value:"rent"}]} value={formData.listing_type} onChange={v => setFormData({...formData,listing_type:v})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Price</Label><Input type="text" value={formData.price} onChange={e => setFormData({...formData, price: formatNumber(e.target.value)})} /></div>
              </div>
              <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Title</Label><Input value={formData.title} onChange={e => setFormData({...formData,title:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Category</Label><Select options={categories.map(c => ({label:c.name,value:c.id.toString()}))} value={formData.category_id} onChange={v => setFormData({...formData,category_id:v})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">City</Label><Input value={formData.city} onChange={e => setFormData({...formData,city:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Short Location (Area)</Label><Input placeholder="e.g. Seminyak" value={formData.location} onChange={e => setFormData({...formData,location:e.target.value})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Full Address</Label><Input placeholder="Street name and number..." value={formData.address} onChange={e => setFormData({...formData,address:e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] uppercase text-gray-400 font-medium pl-1">Narrative Description</Label>
                   <button 
                     type="button" 
                     onClick={() => handleAiWriter('description')} 
                     disabled={aiLoading} 
                     className="flex items-center gap-2 text-[10px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 px-4 py-2 rounded-xl transition-all uppercase tracking-wider border border-brand-100 dark:border-brand-500/20 shadow-sm disabled:opacity-50 whitespace-nowrap"
                   >
                     {aiLoading ? (
                       <div className="h-3 w-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                     ) : (
                       <ShootingStarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                     )} 
                     AI Magic Writer
                   </button>
                </div>
                <textarea className="w-full rounded-2xl border p-4 text-sm dark:bg-gray-900 dark:border-gray-800 outline-none focus:border-brand-500 transition-all min-h-[180px] leading-relaxed" value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} placeholder="Tell the story of this luxury estate..." />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Technical Specs">
            <div className="space-y-3">
              {dynamicSpecs.map((s, i) => (
                <div key={i} className="flex gap-3 items-end">
                   <div className="flex-1"><Label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1 font-medium pl-1">Key</Label><Input value={s.key} onChange={e => { const ns = [...dynamicSpecs]; ns[i].key = e.target.value; setDynamicSpecs(ns); }} /></div>
                   <div className="flex-1"><Label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1 font-medium pl-1">Value</Label><Input value={s.value} onChange={e => { const ns = [...dynamicSpecs]; ns[i].value = e.target.value; setDynamicSpecs(ns); }} /></div>
                   <button type="button" onClick={() => setDynamicSpecs(dynamicSpecs.filter((_, idx)=>idx!==i))} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><TrashBinIcon className="h-5 w-5"/></button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setDynamicSpecs([...dynamicSpecs, {key:"",value:""}])} className="mt-2 border-dashed border-2 w-full font-normal">+ Add Specification</Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Amenities (Select All That Apply)">
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {AMENITIES_LIST.map(amenity => {
                  let Icon = GridIcon;
                  if (amenity.includes("Security")) Icon = LockIcon;
                  if (amenity.includes("WiFi") || amenity.includes("Air Conditioning")) Icon = BoltIcon;
                  if (amenity.includes("View")) Icon = EyeIcon;
                  if (amenity.includes("Furnished") || amenity.includes("Gym")) Icon = BoxIcon;

                  return (
                    <label key={amenity} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer group ${formData.amenities.includes(amenity) ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-brand-200'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) setFormData({...formData, amenities: [...formData.amenities, amenity]});
                          else setFormData({...formData, amenities: formData.amenities.filter(a => a !== amenity)});
                        }}
                      />
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-colors ${formData.amenities.includes(amenity) ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-brand-500'}`}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      <span className={`text-[9px] text-center font-medium uppercase tracking-tight ${formData.amenities.includes(amenity) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {amenity}
                      </span>
                    </label>
                  );
                })}
             </div>
          </ComponentCard>

          <ComponentCard title="Marketing Copy" headerAction={
            <button type="button" onClick={() => handleAiWriter('marketing')} disabled={aiLoading} className="flex items-center gap-2 text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-4 py-2 rounded-xl hover:bg-brand-100 transition-all uppercase tracking-wider border border-brand-100 dark:border-brand-500/20 shadow-sm disabled:opacity-50 whitespace-nowrap">
               {aiLoading ? (
                 <div className="h-3 w-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
               ) : (
                 <ShootingStarIcon className="h-3.5 w-3.5 flex-shrink-0" />
               )} 
               AI Magic Sync
            </button>
          }>
             <div className="space-y-6 pt-2">
                <div className="p-4 bg-brand-50/30 dark:bg-brand-500/5 rounded-2xl border border-dashed border-brand-200 dark:border-brand-500/20">
                   <p className="text-[9px] text-brand-600 dark:text-brand-400 uppercase tracking-widest font-medium mb-1">AI Recommendation</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">Our AI will generate high-ranking SEO titles and social captions based on your unit details.</p>
                </div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">SEO Title</Label><Input value={formData.seo_title} onChange={e => setFormData({...formData, seo_title: e.target.value})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Social Feed Caption</Label><textarea className="w-full rounded-2xl border p-4 text-sm dark:bg-gray-900 dark:border-gray-800 outline-none focus:border-brand-500 transition-all min-h-[120px] leading-relaxed" value={formData.social_caption} onChange={e => setFormData({...formData, social_caption: e.target.value})} /></div>
             </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Media Assets">
             <div className="grid grid-cols-2 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border dark:border-gray-800"><Image src={img.preview} alt="G" fill className="object-cover" /></div>
                ))}
             </div>
             <div onClick={() => document.getElementById('add-imgs')?.click()} className="mt-4 p-4 border-2 border-dashed rounded-xl text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Upload Gallery Images</span>
                <input id="add-imgs" type="file" multiple className="hidden" onChange={e => {
                   if(e.target.files) {
                     const files = Array.from(e.target.files).map(f => ({file:f, preview:URL.createObjectURL(f)}));
                     setImages(prev => [...prev,...files]);
                   }
                }} />
             </div>
          </ComponentCard>
          <ComponentCard title="Save Unit">
             <Button type="submit" className="w-full h-12 uppercase tracking-widest text-xs font-medium" disabled={loading}>{loading ? "Saving..." : "Create Listing"}</Button>
          </ComponentCard>
        </div>
      </form>

      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="max-w-[350px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 shadow-sm ${feedbackModal.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' : (feedbackModal.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-red-50 dark:bg-red-500/10')}`}>
               {feedbackModal.type === 'success' ? <CheckCircleIcon className="h-7 w-7 text-green-500" /> : <AlertIcon className={`h-7 w-7 ${feedbackModal.type === 'warning' ? 'text-orange-500' : 'text-red-500'}`} />}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-2">{feedbackModal.type === 'success' ? 'Success' : (feedbackModal.type === 'warning' ? 'Wait a moment' : 'Failed')}</h3>
            <p className="text-xs text-gray-500 font-normal leading-relaxed mb-8">{feedbackModal.message}</p>
            <button className="w-full h-11 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all hover:opacity-90" onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})}>Dismiss</button>
         </div>
      </Modal>
    </div>
  );
}
