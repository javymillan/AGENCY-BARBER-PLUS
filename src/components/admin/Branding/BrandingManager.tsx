import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Camera, Image as ImageIcon, Save, Trash2, Instagram, Facebook, Layout, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import './BrandingManager.css';


/* ── Color math (mirrors App.tsx logic) ─────────────────────────── */
function buildPalette(hex: string) {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const dk  = (v: number, a: number) => Math.max(0,   Math.round(v * (1 - a)));
  const lt  = (v: number, a: number) => Math.min(255, Math.round(v + (255 - v) * a));
  const hex3 = (rv: number, gv: number, bv: number) =>
    '#' + [rv, gv, bv].map(x => x.toString(16).padStart(2, '0')).join('');
  return {
    brand:  `#${h}`,
    dark:   hex3(dk(r,.22), dk(g,.22), dk(b,.22)),
    light:  hex3(lt(r,.55), lt(g,.55), lt(b,.55)),
    text:   lum > 0.55 ? '#111111' : '#ffffff',
    glow:   `rgba(${r},${g},${b},0.40)`,
    muted:  `rgba(${r},${g},${b},0.12)`,
    border: `rgba(${r},${g},${b},0.30)`,
  };
}

/* ── Preset palettes ─────────────────────────────────────────────── */
const PRESETS = [
  { name: 'Índigo',   color: '#6366f1' },
  { name: 'Ámbar',    color: '#f59e0b' },
  { name: 'Esmeralda',color: '#10b981' },
  { name: 'Rojo',     color: '#ef4444' },
  { name: 'Cielo',    color: '#0ea5e9' },
  { name: 'Violeta',  color: '#8b5cf6' },
  { name: 'Rosa',     color: '#ec4899' },
  { name: 'Naranja',  color: '#f97316' },
  { name: 'Pizarra',  color: '#64748b' },
  { name: 'Lima',     color: '#84cc16' },
];

/* ── Component ───────────────────────────────────────────────────── */
const BrandingManager: React.FC<{ onUpdate?: () => void }> = ({ onUpdate }) => {
  const [businessData, setBusinessData] = useState<any>(null);
  const [gallery, setGallery]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [palette, setPalette]           = useState<ReturnType<typeof buildPalette>>(null);

  useEffect(() => { fetchBranding(); }, []);

  useEffect(() => {
    const color = businessData?.primary_color || '#6366f1';
    setPalette(buildPalette(color));
  }, [businessData?.primary_color]);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const { data: biz } = await supabase.from('business_data').select('*').single();
      if (biz) setBusinessData(biz);
      const { data: gal } = await supabase
        .from('business_gallery').select('*').order('order_index', { ascending: true });
      if (gal) setGallery(gal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('business_data').update({
        name:          businessData.name,
        description:   businessData.description,
        logo_url:      businessData.logo_url,
        instagram_url: businessData.instagram_url,
        facebook_url:  businessData.facebook_url,
        primary_color: businessData.primary_color,
        accent_color:  palette?.light ?? businessData.primary_color,
      }).eq('id', businessData.id);
      if (error) throw error;
      onUpdate?.();
      toast.success('Perfil actualizado correctamente');
    } catch {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleImageProcess = useCallback((file: File, isLogo: boolean) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const max = isLogo ? 400 : 1000;
        if (w > h) { if (w > max) { h *= max/w; w = max; } }
        else       { if (h > max) { w *= max/h; h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            setSaving(true);
            const ts   = Date.now();
            const name = isLogo ? `logo_${ts}.webp` : `gallery_${ts}.webp`;
            const path = `${businessData.id}/${name}`;
            const { error } = await supabase.storage
              .from('business-assets').upload(path, blob, { contentType: 'image/webp', upsert: true });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(path);
            if (isLogo) {
              setBusinessData((d: any) => ({ ...d, logo_url: publicUrl }));
              toast.success('Logotipo cargado. Guarda los cambios.');
            } else {
              await supabase.from('business_gallery').insert([{
                image_url: publicUrl, business_id: businessData.id, order_index: gallery.length + 1
              }]);
              setGallery(g => [...g, { id: ts, image_url: publicUrl }]);
              toast.success('Imagen agregada a la galería');
            }
          } catch { toast.error('Error al subir la imagen'); }
          finally  { setSaving(false); }
        }, 'image/webp', 0.82);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [businessData, gallery]);

  const handleDeleteImage = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await supabase.from('business_gallery').delete().eq('id', id);
    setGallery(g => g.filter(i => i.id !== id));
    toast.success('Imagen eliminada');
  };

  if (loading) return <div className="bm-loading">Cargando perfil…</div>;

  return (
    <div className="bm-root">

      {/* ── Perfil de Empresa ── */}
      <section className="bm-card">
        <h2 className="bm-section-title"><Layout size={20} /> Perfil de Empresa</h2>

        <div className="bm-grid-2">
          {/* Left column */}
          <div className="bm-col">
            <div className="bm-field">
              <label className="bm-label">Nombre Comercial</label>
              <input className="bm-input"
                value={businessData?.name || ''}
                onChange={e => setBusinessData((d: any) => ({ ...d, name: e.target.value }))}
              />
            </div>

            <div className="bm-field">
              <label className="bm-label">Descripción / Bio</label>
              <textarea className="bm-textarea"
                placeholder="Escribe sobre tu barbería…"
                value={businessData?.description || ''}
                onChange={e => setBusinessData((d: any) => ({ ...d, description: e.target.value }))}
              />
            </div>

            {/* Social */}
            <div className="bm-field">
              <label className="bm-label">Redes Sociales</label>
              <div className="bm-social-row">
                <Instagram size={18} className="bm-social-icon bm-ig" />
                <input className="bm-input bm-input--social" placeholder="Instagram URL"
                  value={businessData?.instagram_url || ''}
                  onChange={e => setBusinessData((d: any) => ({ ...d, instagram_url: e.target.value }))}
                />
              </div>
              <div className="bm-social-row">
                <Facebook size={18} className="bm-social-icon bm-fb" />
                <input className="bm-input bm-input--social" placeholder="Facebook URL"
                  value={businessData?.facebook_url || ''}
                  onChange={e => setBusinessData((d: any) => ({ ...d, facebook_url: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Right column: Logo */}
          <div className="bm-col">
            <label className="bm-label">Logotipo</label>
            <div className="bm-logo-drop"
              onClick={() => document.getElementById('logo-upload')?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation();
                if (e.dataTransfer.files[0]) handleImageProcess(e.dataTransfer.files[0], true);
              }}
            >
              <input id="logo-upload" type="file" accept="image/*" className="bm-hidden"
                onChange={e => { if (e.target.files?.[0]) handleImageProcess(e.target.files[0], true); }}
              />
              <div className="bm-logo-circle"
                style={palette ? { borderColor: palette.brand, boxShadow: `0 0 0 4px ${palette.muted}` } : undefined}
              >
                {businessData?.logo_url
                  ? <img src={businessData.logo_url} alt="Logo" className="bm-logo-img" />
                  : <Camera size={28} style={{ color: palette?.brand }} />}
              </div>
              <p className="bm-logo-hint">Haz clic o arrastra una imagen</p>
              <input className="bm-input bm-input--url" placeholder="O pega una URL de imagen aquí"
                value={businessData?.logo_url || ''}
                onClick={e => e.stopPropagation()}
                onChange={e => setBusinessData((d: any) => ({ ...d, logo_url: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* ── Color de Marca ─────────────────────────────────── */}
        <div className="bm-color-section">
          <div className="bm-color-header">
            <Palette size={18} />
            <div>
              <span className="bm-color-title">Color de Marca</span>
              <span className="bm-color-sub">
                Elige un color — el sistema genera toda la paleta automáticamente
              </span>
            </div>
          </div>

          {/* Picker + preview row */}
          <div className="bm-color-row">
            {/* Color input */}
            <div className="bm-color-pick-wrap">
              <div className="bm-color-swatch"
                style={{ background: palette?.brand ?? '#6366f1', boxShadow: `0 4px 16px ${palette?.glow ?? 'transparent'}` }}
              />
              <input type="color" className="bm-color-native"
                value={businessData?.primary_color || '#6366f1'}
                onChange={e => setBusinessData((d: any) => ({ ...d, primary_color: e.target.value }))}
              />
              <span className="bm-color-hex">{businessData?.primary_color?.toUpperCase() || '#6366F1'}</span>
            </div>

            {/* Palette preview */}
            {palette && (
              <div className="bm-palette-preview">
                <PaletteToken label="Principal" bg={palette.brand}  text={palette.text} />
                <PaletteToken label="Oscuro"    bg={palette.dark}   text="#fff" />
                <PaletteToken label="Claro"     bg={palette.light}  text="#111" />
                <PaletteToken label="Suave"     bg={palette.muted}  text={palette.brand} border={palette.border} />
              </div>
            )}
          </div>

          {/* Preset swatches */}
          <div className="bm-presets">
            <span className="bm-presets-label">Paletas rápidas:</span>
            {PRESETS.map(p => (
              <button key={p.color} className="bm-preset-btn"
                style={{
                  background: p.color,
                  outline: businessData?.primary_color === p.color ? `3px solid ${p.color}` : undefined,
                  outlineOffset: '2px',
                }}
                title={p.name}
                onClick={() => setBusinessData((d: any) => ({ ...d, primary_color: p.color }))}
              />
            ))}
          </div>

          {/* Live UI preview */}
          {palette && (
            <div className="bm-ui-preview">
              <span className="bm-ui-preview-label">Vista previa en la app</span>
              <div className="bm-ui-preview-row">
                {/* CTA button */}
                <div className="bm-preview-btn"
                  style={{ background: palette.brand, color: palette.text, boxShadow: `0 4px 14px ${palette.glow}` }}
                >
                  Reservar cita
                </div>
                {/* Hover state */}
                <div className="bm-preview-btn"
                  style={{ background: palette.dark, color: '#fff' }}
                >
                  Hover
                </div>
                {/* Card / badge */}
                <div className="bm-preview-badge"
                  style={{ background: palette.muted, color: palette.brand, border: `1px solid ${palette.border}` }}
                >
                  Confirmado
                </div>
                {/* Accent highlight */}
                <div className="bm-preview-pill"
                  style={{ background: palette.light, color: '#111' }}
                >
                  {businessData?.name || 'Tu Barbería'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bm-save-row">
          <button className="bm-save-btn"
            onClick={handleSaveBusiness}
            disabled={saving}
            style={palette ? {
              background: `linear-gradient(135deg, ${palette.brand}, ${palette.dark})`,
              boxShadow: `0 8px 24px ${palette.glow}`,
              color: palette.text,
            } : undefined}
          >
            <Save size={18} />
            {saving ? 'Guardando…' : 'Guardar Cambios de Perfil'}
          </button>
        </div>
      </section>

      {/* ── Galería ─────────────────────────────────────────── */}
      <section className="bm-card">
        <div className="bm-gallery-header">
          <h2 className="bm-section-title"><ImageIcon size={20} /> Galería de Trabajos</h2>
          <button className="bm-gallery-add"
            onClick={() => document.getElementById('gallery-upload')?.click()}
          >
            <input id="gallery-upload" type="file" accept="image/*" className="bm-hidden"
              onChange={e => { if (e.target.files?.[0]) handleImageProcess(e.target.files[0], false); }}
            />
            <ImageIcon size={16} /> Añadir Trabajo
          </button>
        </div>

        <div className="bm-gallery-grid"
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); e.stopPropagation();
            if (e.dataTransfer.files[0]) handleImageProcess(e.dataTransfer.files[0], false);
          }}
        >
          {gallery.map(img => (
            <div key={img.id} className="bm-gallery-item">
              <img src={img.image_url} alt="Trabajo" className="bm-gallery-img" />
              <div className="bm-gallery-overlay">
                <button className="bm-gallery-del" onClick={() => handleDeleteImage(img.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="bm-gallery-empty">
              No hay fotos todavía. ¡Muestra tus mejores cortes!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/* ── Palette token chip ─────────────────────────────── */
const PaletteToken: React.FC<{
  label: string; bg: string; text: string; border?: string;
}> = ({ label, bg, text, border }) => (
  <div className="bm-token" style={{ background: bg, color: text, border: border ? `1px solid ${border}` : undefined }}>
    <span className="bm-token-label">{label}</span>
    <span className="bm-token-hex">{bg}</span>
  </div>
);

export default BrandingManager;
