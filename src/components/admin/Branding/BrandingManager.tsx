import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Camera, Image as ImageIcon, Save, Trash2, Globe, Instagram, Facebook, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

const BrandingManager: React.FC = () => {
  const [businessData, setBusinessData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      // Get business info
      const { data: biz } = await supabase
        .from('business_data')
        .select('*')
        .single();
      
      if (biz) setBusinessData(biz);

      // Get gallery
      const { data: gal } = await supabase
        .from('business_gallery')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (gal) setGallery(gal);
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('business_data')
        .update({
          name: businessData.name,
          description: businessData.description,
          logo_url: businessData.logo_url,
          instagram_url: businessData.instagram_url,
          facebook_url: businessData.facebook_url,
          primary_color: businessData.primary_color,
          accent_color: businessData.accent_color,
        })
        .eq('id', businessData.id);

      if (error) throw error;
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleImageProcess = (file: File, isLogo: boolean) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = isLogo ? 400 : 1000;
        if (width > height) {
          if (width > max) { height *= max / width; width = max; }
        } else {
          if (height > max) { width *= max / height; height = max; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          try {
            setSaving(true);
            const timestamp = Date.now();
            const fileName = isLogo ? `logo_${timestamp}.webp` : `gallery_${timestamp}.webp`;
            const filePath = `${businessData.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('business-assets')
              .upload(filePath, blob, {
                contentType: 'image/webp',
                upsert: true
              });
              
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('business-assets')
              .getPublicUrl(filePath);
              
            if (isLogo) {
              setBusinessData({ ...businessData, logo_url: publicUrl });
              toast.success('Logotipo cargado a la nube. No olvides Guardar Cambios.');
            } else {
              saveGalleryImage(publicUrl);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Error al subir la imagen');
          } finally {
            setSaving(false);
          }
        }, 'image/webp', 0.82);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveGalleryImage = async (url: string) => {
    try {
      const { data, error } = await supabase
        .from('business_gallery')
        .insert([{ image_url: url, business_id: businessData.id, order_index: gallery.length + 1 }])
        .select();
      
      if (error) throw error;
      setGallery([...gallery, ...data]);
      toast.success('Imagen agregada a la galería');
    } catch (error) {
      toast.error('Error al agregar imagen');
    }
  };

  const handleAddGalleryImage = (e?: React.MouseEvent) => {
    if (e) {
      document.getElementById('gallery-upload')?.click();
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta imagen?')) return;
    try {
      await supabase.from('business_gallery').delete().eq('id', id);
      setGallery(gallery.filter(i => i.id !== id));
      toast.success('Imagen eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <div>Cargando perfil...</div>;

  return (
    <div className="branding-manager space-y-8 animate-fadeIn">
      <div className="bg-secondary/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Layout className="text-primary" /> Perfil de Empresa
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Side */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Nombre Comercial</label>
              <input 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                value={businessData?.name || ''}
                onChange={e => setBusinessData({...businessData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Descripción / Bio</label>
              <textarea 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 min-h-[100px] outline-none"
                placeholder="Escribe sobre tu barbería..."
                value={businessData?.description || ''}
                onChange={e => setBusinessData({...businessData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Color Principal</label>
                  <input type="color" className="w-full h-10 rounded-lg p-0 cursor-pointer overflow-hidden" 
                    value={businessData?.primary_color || '#deb887'}
                    onChange={e => setBusinessData({...businessData, primary_color: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Color Acento</label>
                  <input type="color" className="w-full h-10 rounded-lg p-0 cursor-pointer overflow-hidden" 
                    value={businessData?.accent_color || '#1a1a1a'}
                    onChange={e => setBusinessData({...businessData, accent_color: e.target.value})}
                  />
               </div>
            </div>
          </div>

          {/* Logo & Social Side */}
          <div className="space-y-4">
            <div className="flex flex-col items-center p-4 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-2xl bg-black/20 cursor-pointer relative"
                 onClick={() => document.getElementById('logo-upload')?.click()}
                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 onDrop={(e) => { 
                   e.preventDefault(); e.stopPropagation(); 
                   if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                     handleImageProcess(e.dataTransfer.files[0], true);
                     e.dataTransfer.clearData();
                   }
                 }}
            >
              <input 
                id="logo-upload"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImageProcess(e.target.files[0], true);
                  }
                }} 
              />
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden mb-3 border-2 border-primary pointer-events-none">
                {businessData?.logo_url ? (
                  <img src={businessData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-primary" />
                )}
              </div>
              <p className="text-xs text-text-secondary text-center">Haz clic o arrastra una imagen para el logotipo</p>
              
              {/* Optional direct URL input if they prefer it */}
              <input 
                className="text-xs bg-black/50 p-2 rounded w-full mt-3 cursor-text" 
                placeholder="O pega una URL de imagen aquí"
                value={businessData?.logo_url || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={e => setBusinessData({...businessData, logo_url: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <Instagram size={18} className="text-pink-500" />
                <input className="bg-transparent border-none outline-none w-full text-sm" placeholder="Instagram URL" 
                  value={businessData?.instagram_url || ''}
                  onChange={e => setBusinessData({...businessData, instagram_url: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <Facebook size={18} className="text-blue-500" />
                <input className="bg-transparent border-none outline-none w-full text-sm" placeholder="Facebook URL" 
                  value={businessData?.facebook_url || ''}
                  onChange={e => setBusinessData({...businessData, facebook_url: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveBusiness}
            disabled={saving}
            className="bg-primary hover:bg-primary/80 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Cambios de Perfil'}
          </button>
        </div>
      </div>

      <div className="bg-secondary/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="text-primary" /> Galería de Trabajos
          </h2>
          <div>
            <input 
              id="gallery-upload"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleImageProcess(e.target.files[0], false);
                }
              }} 
            />
            <button 
              onClick={handleAddGalleryImage}
              className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <ImageIcon size={18} /> Añadir Trabajo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
             onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
             onDrop={(e) => { 
               e.preventDefault(); e.stopPropagation(); 
               if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                 handleImageProcess(e.dataTransfer.files[0], false);
                 e.dataTransfer.clearData();
               }
             }}
        >
          {gallery.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square border border-white/10 shadow-lg">
              <img src={img.image_url} alt={img.caption || 'Trabajo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={() => handleDeleteImage(img.id)}
                  className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-secondary border-2 border-dashed border-white/5 rounded-2xl">
              No hay fotos en tu galería todavía. ¡Muestra tus mejores cortes!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandingManager;
