"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { PencilIcon } from "@/icons";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";

export default function ProfilePage() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    whatsapp_number: "",
    telegram_id: "",
    agency_name: "",
    bio: "",
    avatar_url: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        whatsapp_number: profile.whatsapp_number || "",
        telegram_id: profile.telegram_id || "",
        agency_name: profile.agency_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Menggunakan ID user sebagai nama file agar rapi dan menimpa yang lama
      const filePath = `${profile.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true, // Menimpa file lama dengan nama yang sama
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Tambahkan timestamp anti-cache agar gambar langsung terupdate di UI
      const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;

      setFormData(prev => ({ ...prev, avatar_url: finalUrl }));
      
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      setMessage({ type: "success", text: "Avatar updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Role ID sengaja tidak dimasukkan ke dalam payload update
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
        telegram_id: formData.telegram_id,
        agency_name: formData.agency_name,
        bio: formData.bio
      })
      .eq("id", profile.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }
    setLoading(false);
  };

  if (authLoading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) p-4 md:p-6">
      <PageBreadcrumb pageTitle="Profile Settings" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <ComponentCard title="User Overview">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-gray-800">
                  <Image
                    src={formData.avatar_url || "/images/user/user-01.jpg"}
                    alt="User"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-lg transition-all hover:scale-110 hover:text-brand-500 active:scale-95 dark:border-gray-700 dark:bg-gray-900"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={uploadAvatar} className="hidden" accept="image/*" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {formData.full_name || "User Name"}
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {profile?.email}
              </p>
              
              <Badge color={profile?.role === 'superuser' ? 'success' : 'primary'} variant="light">
                {profile?.role?.toUpperCase()}
              </Badge>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Agency</span>
                    <span className="font-semibold text-gray-800 dark:text-white/90">{formData.agency_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phone</span>
                    <span className="font-semibold text-gray-800 dark:text-white/90">{formData.phone || "-"}</span>
                  </div>
               </div>
            </div>
          </ComponentCard>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard 
            title="Personal Information" 
            desc="Update your identity and contact details for the AI Agency to use."
          >
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                   <Label>Full Name</Label>
                   <Input
                     value={formData.full_name}
                     onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                     placeholder="John Doe"
                   />
                </div>
                <div>
                   <Label>Agency Name</Label>
                   <Input
                     value={formData.agency_name}
                     onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                     placeholder="Lombok Agency"
                   />
                </div>
                <div>
                   <Label>Phone Number</Label>
                   <Input
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     placeholder="+62..."
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                   <Label>WhatsApp Number</Label>
                   <Input
                     value={formData.whatsapp_number}
                     onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                     placeholder="+62..."
                   />
                </div>
                <div>
                   <Label>Telegram Handle</Label>
                   <Input
                     value={formData.telegram_id}
                     onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                     placeholder="@handle"
                   />
                </div>
              </div>

              <div>
                <Label>Professional Bio</Label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-transparent p-4 text-sm focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  rows={4}
                  placeholder="Describe your expertise in real estate..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => window.location.reload()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
