"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { supabase } from "@/lib/supabase";
import { 
  GridIcon as GridIconRaw, 
  CloseIcon as CloseIconRaw, 
  TrashBinIcon as TrashBinIconRaw, 
  PlusIcon as PlusIconRaw, 
  CheckCircleIcon as CheckCircleIconRaw, 
  AlertIcon as AlertIconRaw, 
  ShootingStarIcon as ShootingStarIconRaw,
  LockIcon as LockIconRaw,
  BoltIcon as BoltIconRaw,
  EyeIcon as EyeIconRaw,
  BoxIcon as BoxIconRaw
} from "@/icons";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";

const GridIcon = GridIconRaw as any;
const CloseIcon = CloseIconRaw as any;
const TrashBinIcon = TrashBinIconRaw as any;
const PlusIcon = PlusIconRaw as any;
const CheckCircleIcon = CheckCircleIconRaw as any;
const AlertIcon = AlertIconRaw as any;
const ShootingStarIcon = ShootingStarIconRaw as any;
const LockIcon = LockIconRaw as any;
const BoltIcon = BoltIconRaw as any;
const EyeIcon = EyeIconRaw as any;
const BoxIcon = BoxIconRaw as any;

export default function EditPropertyBySlugPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [dynamicSpecs, setDynamicSpecs] = useState<{ key: string; value: string }[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
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

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedbackModal({ isOpen: true, type, message });
  };

  useEffect(() => { 
    if (slug) fetchInitialData(); 
  }, [slug]);

  const formatNumber = (val: string) => val ? val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

  const fetchInitialData = async () => {
    if (!slug) return;
    
    try {
      setFetchLoading(true);
      const realSlug = Array.isArray(slug) ? slug[0] : slug;

      // Parallel execution for faster load
      const [catsRes, propRes] = await Promise.all([
        supabase.from("property_categories").select("id, name").order("name"),
        supabase
          .from("properties")
          .select(`*, images:property_images!property_images_property_id_fkey(id, image_url, is_primary)`)
          .eq("slug", realSlug)
          .single()
      ]);

      if (catsRes.data) setCategories(catsRes.data);

      if (propRes.error || !propRes.data) {
        console.error("DEBUG: Property fetch error:", propRes.error?.message || "No property found");
        showFeedback('error', "Property not found. Redirecting...");
        setTimeout(() => router.push("/dashboard/properties"), 2000);
        return;
      }
      
      const prop = propRes.data;
      setPropertyId(prop.id);
      setFormData({
        title: prop.title,
        slug: prop.slug,
        category_id: prop.category_id?.toString() || "",
        listing_type: prop.listing_type || "sale",
        description: prop.description || "",
        price: formatNumber(prop.price?.toString()),
        currency: prop.currency || "IDR",
        location: prop.location || "",
        address: prop.address || "",
        city: prop.city || "",
        status: prop.status || "active",
        amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
        seo_title: prop.marketing_copy?.seo_title || "",
        social_caption: prop.marketing_copy?.social_caption || ""
      });
      setExistingImages(prop.images || []);

      if (prop.specifications && typeof prop.specifications === 'object') {
        const loadedSpecs = Object.entries(prop.specifications).map(([key, value]) => ({
          key, value: String(value)
        }));
        setDynamicSpecs(loadedSpecs);
      }
    } catch (error: any) { console.error("Optimization Error:", error.message); } finally { setFetchLoading(false); }
  };

  const validateForAi = () => {
    const missing = [];
    if (!formData.title) missing.push("Title");
    if (!formData.price) missing.push("Price");
    if (!formData.city) missing.push("City");
    if (dynamicSpecs.length < 2) missing.push("2 Specs");
    if (missing.length > 0) {
      showFeedback('warning', `Complete these first: ${missing.join(", ")}`);
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
      const selectedCat = categories.find(c => c.id.toString() === formData.category_id)?.name || "Property";

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, category_name: selectedCat, specifications: specObject })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "AI Sync failed");

      if (res) {
        if (field === 'description') {
           setFormData(prev => ({ ...prev, description: res.description }));
           showFeedback('success', "AI Magic complete! Story generated.");
        } else {
           setFormData(prev => ({ ...prev, seo_title: res.seo_title, social_caption: res.social_caption }));
           showFeedback('success', "Marketing strategy synced.");
        }
      }
    } catch (e: any) { showFeedback('error', e.message); } finally { setAiLoading(false); }
  };

  const addSpec = () => setDynamicSpecs([...dynamicSpecs, { key: "", value: "" }]);
  const removeSpec = (index: number) => setDynamicSpecs(dynamicSpecs.filter((_, i) => i !== index));
  const updateSpec = (index: number, f: "key" | "value", val: string) => {
    const newSpecs = [...dynamicSpecs];
    // @ts-ignore
    newSpecs[index][f] = val;
    setDynamicSpecs(newSpecs);
  };

  const deleteExistingImage = async (id: number) => {
    if (!confirm("Delete permanently?")) return;
    await supabase.from("property_images").delete().eq("id", id);
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

  const setPrimaryImage = async (imageUrl: string, imageId?: number) => {
    if (!propertyId) return;
    
    // 1. Reset all to false in DB
    await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId);
    
    // 2. Set this one to true
    if (imageId) {
      await supabase.from("property_images").update({ is_primary: true }).eq("id", imageId);
    }
    
    // 3. Sync to main properties table for simplified catalog view
    await supabase.from("properties").update({ main_image: imageUrl }).eq("id", propertyId);
    
    // 4. Update local state
    setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.image_url === imageUrl })));
    setFormData(prev => ({ ...prev })); // trigger re-render
    showFeedback('success', "Primary image updated!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;
    setLoading(true);

    try {
      const specObject: Record<string, string> = {};
      dynamicSpecs.forEach(s => { if(s.key) specObject[s.key] = s.value; });
      const numericPrice = parseFloat(formData.price.replace(/,/g, ""));

      const { error: propError } = await supabase
        .from("properties")
        .update({
          category_id: parseInt(formData.category_id),
          title: formData.title,
          slug: formData.slug,
          listing_type: formData.listing_type,
          description: formData.description,
          price: numericPrice,
          location: formData.location,
          address: formData.address,
          city: formData.city,
          status: formData.status,
          amenities: formData.amenities,
          specifications: specObject,
          marketing_copy: { seo_title: formData.seo_title || formData.title, social_caption: formData.social_caption },
          updated_at: new Date().toISOString()
        })
        .eq("id", propertyId);

      if (propError) throw propError;

      if (newImages.length > 0) {
        const uploadPromises = newImages.map(async (img, idx) => {
          const nextIndex = existingImages.length + idx + 1;
          const fileName = `${propertyId}-${nextIndex}-${Date.now()}.${img.file.name.split('.').pop()}`;
          const filePath = `${propertyId}/${fileName}`;
          await supabase.storage.from("properties").upload(filePath, img.file, { upsert: true });
          const { data: { publicUrl } } = supabase.storage.from("properties").getPublicUrl(filePath);
          return { property_id: propertyId, image_url: publicUrl, is_primary: false };
        });
        const imageData = await Promise.all(uploadPromises);
        await supabase.from("property_images").insert(imageData);
      }
      router.push("/dashboard/properties");
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

  if (fetchLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Fetching Property by Slug...</div>;

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <PageBreadcrumb pageTitle={`Editing: ${formData.title}`} />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard title="General Identity">
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Market</Label><Select options={[{label:"Sale",value:"sale"},{label:"Rent",value:"rent"}]} value={formData.listing_type} onChange={v => setFormData({...formData,listing_type:v})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Price</Label><Input type="text" value={formData.price} onChange={e => setFormData({...formData, price: formatNumber(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Title</Label><Input value={formData.title} onChange={e => setFormData({...formData,title:e.target.value})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1 text-brand-600">Permalink (Slug)</Label><Input value={formData.slug} onChange={e => setFormData({...formData,slug:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">Category</Label><Select options={categories.map(c => ({label:c.name,value:c.id.toString()}))} value={formData.category_id} onChange={v => setFormData({...formData,category_id:v})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1">City</Label><Input value={formData.city} onChange={e => setFormData({...formData,city:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1 text-brand-600">Short Location (Area)</Label><Input placeholder="e.g. Seminyak" value={formData.location} onChange={e => setFormData({...formData,location:e.target.value})} /></div>
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium pl-1 text-brand-600">Full Address</Label><Input placeholder="Street name and number..." value={formData.address} onChange={e => setFormData({...formData,address:e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] uppercase text-gray-400 font-medium pl-1">Narrative Description</Label>
                   <button type="button" onClick={() => handleAiWriter('description')} disabled={aiLoading} className="flex items-center gap-2 text-[10px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 px-4 py-2 rounded-xl transition-all uppercase tracking-wider border border-brand-100 dark:border-brand-500/20 shadow-sm disabled:opacity-50 whitespace-nowrap">
                     {aiLoading ? <div className="h-3 w-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/> : <ShootingStarIcon className="h-3.5 w-3.5 flex-shrink-0" />} 
                     AI Magic Writer
                   </button>
                </div>
                <textarea className="w-full rounded-2xl border p-4 text-sm dark:bg-gray-900 dark:border-gray-800 outline-none focus:border-brand-500 transition-all font-normal text-gray-600 dark:text-gray-400 min-h-[180px] leading-relaxed shadow-theme-xs" value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} placeholder="Describe the soul of this property..." />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Technical Specs">
            <div className="space-y-3">
              {dynamicSpecs.map((spec, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1.5 font-medium pl-1">Spec Name</Label>
                    <Input placeholder="e.g. Zoning" value={spec.key} onChange={e => updateSpec(index, "key", e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1.5 font-medium pl-1">Value</Label>
                    <Input placeholder="e.g. Tourism" value={spec.value} onChange={e => updateSpec(index, "value", e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeSpec(index)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <TrashBinIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSpec} className="mt-2 border-dashed border-2 w-full font-normal">+ Add More Spec</Button>
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
               {aiLoading ? <div className="h-3 w-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/> : <ShootingStarIcon className="h-3.5 w-3.5 flex-shrink-0" />} 
               AI Magic Sync
            </button>
          }>
             <div className="space-y-6 pt-2">
                <div className="p-4 bg-brand-50/30 dark:bg-brand-500/5 rounded-2xl border border-dashed border-brand-200 dark:border-brand-500/20">
                   <p className="text-[9px] text-brand-600 dark:text-brand-400 uppercase tracking-widest font-medium mb-1">AI Recommendation</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">Our AI will generate high-ranking SEO titles and social captions to boost visibility.</p>
                </div>
                <div><Label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium pl-1">SEO Title</Label><Input value={formData.seo_title} onChange={e => setFormData({...formData, seo_title: e.target.value})} /></div>
                <div><Label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium pl-1">Social Feed Caption</Label><textarea className="w-full rounded-2xl border p-4 text-sm dark:bg-gray-900 dark:border-gray-800 outline-none focus:border-brand-500 transition-all font-normal min-h-[120px]" value={formData.social_caption} onChange={e => setFormData({...formData, social_caption: e.target.value})} /></div>
             </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Gallery">
             <div className="grid grid-cols-2 gap-2">
                {existingImages.map(img => (
                  <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all ${img.is_primary ? 'border-brand-500 shadow-lg' : 'border-gray-100 dark:border-gray-800'}`}>
                    <Image src={img.image_url} alt="G" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       {!img.is_primary && (
                         <button type="button" onClick={() => setPrimaryImage(img.image_url, img.id)} className="p-2 bg-white text-brand-600 rounded-full hover:bg-brand-500 hover:text-white transition-all">
                           <CheckCircleIcon className="h-4 w-4" />
                         </button>
                       )}
                       <button type="button" onClick={() => deleteExistingImage(img.id)} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all">
                         <TrashBinIcon className="h-4 w-4"/>
                       </button>
                    </div>
                    {img.is_primary && <div className="absolute top-2 left-2 bg-brand-500 text-white text-[7px] uppercase tracking-widest px-2 py-1 rounded-md font-bold shadow-sm">Primary</div>}
                  </div>
                ))}
                {newImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-brand-200 dark:border-brand-500/30">
                    <Image src={img.preview} alt="New" fill className="object-cover transition-transform group-hover:scale-110" />
                    <button type="button" onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-gray-900/50 text-white rounded-full hover:bg-red-500 transition-colors"><CloseIcon className="h-3 w-3"/></button>
                    <div className="absolute inset-0 bg-brand-500/10 pointer-events-none" />
                  </div>
                ))}
             </div>
             <div onClick={() => document.getElementById('edit-imgs')?.click()} className="mt-4 p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                <span className="text-[9px] font-medium text-gray-400 group-hover:text-brand-600 uppercase tracking-widest transition-colors">Add Gallery Photos</span>
                <input id="edit-imgs" type="file" multiple className="hidden" onChange={e => {
                   if(e.target.files) {
                     const files = Array.from(e.target.files).map(f => ({file:f, preview:URL.createObjectURL(f)}));
                     setNewImages(prev => [...prev,...files]);
                   }
                }} />
             </div>
          </ComponentCard>
          <ComponentCard title="Publishing">
             <div className="space-y-4">
                <div><Label className="text-[10px] uppercase text-gray-400 mb-1 font-medium">Visibility</Label><Select options={[{label:"Active / Live",value:"active"},{label:"Sold Out",value:"sold"},{label:"Archived",value:"archived"}]} value={formData.status} onChange={v => setFormData({...formData,status:v})} /></div>
                <Button type="submit" className="w-full h-12 uppercase tracking-widest text-xs font-medium" disabled={loading}>{loading ? "Syncing..." : "Save Changes"}</Button>
             </div>
          </ComponentCard>
        </div>
      </form>

      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({...feedbackModal, isOpen: false})} className="max-w-[350px] p-8 text-center">
         <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 shadow-sm ${feedbackModal.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' : (feedbackModal.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-red-50 dark:bg-red-500/10')}`}>
               {feedbackModal.type === 'success' ? <CheckCircleIcon className="h-7 w-7 text-green-500" /> : <AlertIcon className={`h-7 w-7 ${feedbackModal.type === 'warning' ? 'text-orange-500' : 'text-red-500'}`} />}
            </div>
            <h3 className="text-lg font-normal text-gray-800 dark:text-white mb-2">{feedbackModal.type === 'success' ? 'Success' : (feedbackModal.type === 'warning' ? 'Information' : 'Operation Failed')}</h3>
            <p className="text-xs text-gray-500 font-normal leading-relaxed mb-8">{feedbackModal.message}</p>
            <button className="w-full h-11 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] uppercase tracking-widest rounded-xl font-medium transition-all" onClick={() => setFeedbackModal({...feedbackModal, isOpen: false})}>Dismiss</button>
         </div>
      </Modal>
    </div>
  );
}
