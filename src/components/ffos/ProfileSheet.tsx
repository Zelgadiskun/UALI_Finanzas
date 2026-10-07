import React, { useState, useEffect } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Flame,
  Globe,
  Mail,
  Share2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { UserAvatarDisplay } from "@/components/ffos/UserAvatarDisplay";
import { getStoredAvatar, saveStoredAvatar, type AvatarPreset } from "@/lib/ffos/avatar";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUserId, useProfileQuery, queryKeys } from "@/lib/supabase/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: "default", label: "Inicial", type: "letter" },
  { id: "nido", label: "Nido", type: "nido" },
  { id: "toto", label: "Toto", type: "toto" },
  { id: "chispa", label: "Chispa", type: "chispa" },
  { id: "star", label: "Estrella", emoji: "⭐", type: "emoji" },
  { id: "fire", label: "Fuego", emoji: "🔥", type: "emoji" },
  { id: "money", label: "Bolsa", emoji: "💰", type: "emoji" },
];

const SOCIAL_TIPS = [
  {
    id: "tip-flow",
    title: "Conservar mi flujo de caja",
    category: "Flujo Continuo",
    snippet:
      "Al iniciar un nuevo mes mi dinero no se resetea a cero: en UALÍ Finanzas conservo mi remanente y sé exactamente mi liquidez disponible. 🚀📊 #UALIFinanzas #FinanzasPersonales",
  },
  {
    id: "tip-503020",
    title: "La Regla 50 / 30 / 20",
    category: "Presupuesto",
    snippet:
      "50% necesidades, 30% gustos sin culpa y 20% para mi ahorro Nido. Así mantengo el control de mi dinero día a día con UALÍ Finanzas. 💡💰 #HabitosFinancieros",
  },
  {
    id: "tip-nido",
    title: "Protección con Nido",
    category: "Ahorro",
    snippet:
      "Mi fondo de emergencia está protegido con Nido en UALÍ. Separar la reserva de los gastos diarios me da paz mental total. 🪺🛡️ #AhorroInteligente",
  },
  {
    id: "tip-streak",
    title: "Racha y Puntos FFOS",
    category: "Gamificación",
    snippet:
      "2 minutos al día registrando mis gastos y respondiendo las trivias con Toto y Chispa. ¡Acumulando Puntos FFOS en UALÍ Finanzas! ⚡🎮 #EducacionFinanciera",
  },
];

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const profileQuery = useProfileQuery();
  const { session } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("default");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTipId, setSelectedTipId] = useState(SOCIAL_TIPS[0].id);
  const [copiedTip, setCopiedTip] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profileQuery.data?.display_name || "");
      setEmail(session?.user?.email || "");
      const stored = getStoredAvatar();
      setSelectedAvatar(stored.preset);
      setCustomPhoto(stored.customPhoto);
    }
  }, [open, profileQuery.data, session]);

  if (!open) return null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Por favor ingresa un nombre válido");
      return;
    }

    setSaving(true);
    try {
      if (userId) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName.trim() })
          .eq("id", userId);

        queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      }

      saveStoredAvatar(selectedAvatar as AvatarPreset, customPhoto);

      toast.success("¡Perfil actualizado con éxito!");
      onClose();
    } catch {
      toast.error("Error al actualizar perfil. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomPhoto(result);
      setSelectedAvatar("custom");
      saveStoredAvatar("custom", result);
    };
    reader.readAsDataURL(file);
  }

  const activeTip = SOCIAL_TIPS.find((t) => t.id === selectedTipId) || SOCIAL_TIPS[0];

  async function handleShareNative() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Mi experiencia en UALÍ Finanzas",
          text: activeTip.snippet,
          url: window.location.origin,
        });
        toast.success("¡Compartido con éxito!");
      } catch {
        // Usuario canceló el share dialog
      }
    } else {
      handleCopyText();
    }
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `${activeTip.snippet}\n\nConoce más en: ${window.location.origin}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(activeTip.snippet);
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  function handleCopyText() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(`${activeTip.snippet}\n\n${window.location.origin}`);
      setCopiedTip(true);
      toast.success("¡Texto copiado al portapapeles para compartir!");
      setTimeout(() => setCopiedTip(false), 2000);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-card border border-border/80 shadow-2xl p-5 overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Handle superior para móvil */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <User className="size-4.5" />
            </div>
            <div>
              <h2 id="profile-title" className="text-base font-black text-foreground">
                Mi Perfil & Ajustes
              </h2>
              <p className="text-[11px] text-muted-foreground">Personaliza tu cuenta y comparte</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto py-3 space-y-4 pr-0.5">
          {/* 1. SECCIÓN DE AVATAR */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-teal-400" />
              Foto o Personaje de Perfil
            </span>

            {/* Vista previa central */}
            <div className="flex items-center gap-3.5">
              <div className="relative size-16 rounded-full overflow-hidden border-2 border-[#F6BE22] bg-[#141F36] ring-4 ring-[#F6BE22]/20 flex items-center justify-center shadow-lg shrink-0">
                {customPhoto && selectedAvatar === "custom" ? (
                  <img
                    src={customPhoto}
                    alt="Foto personalizada"
                    className="size-full object-cover"
                  />
                ) : selectedAvatar === "nido" ? (
                  <NidoCharacter className="size-12" />
                ) : selectedAvatar === "toto" ? (
                  <TotoCharacter className="size-12" />
                ) : selectedAvatar === "chispa" ? (
                  <ChispaCharacter className="size-12" />
                ) : selectedAvatar === "star" ? (
                  <span className="text-2xl">⭐</span>
                ) : selectedAvatar === "fire" ? (
                  <span className="text-2xl">🔥</span>
                ) : selectedAvatar === "money" ? (
                  <span className="text-2xl">💰</span>
                ) : (
                  <span className="font-extrabold text-2xl text-amber-300">
                    {displayName.charAt(0).toUpperCase() || "U"}
                  </span>
                )}

                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white"
                  title="Cambiar foto"
                >
                  <Camera className="size-5" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">Elige tu estilo visual</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Selecciona tu personaje favorito o sube una foto desde tu galería.
                </p>
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-teal-400 hover:underline cursor-pointer"
                >
                  <Camera className="size-3" />
                  <span>Subir foto de galería</span>
                </label>
              </div>
            </div>

            {/* Fila de avatares predeterminados */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
              {PRESET_AVATARS.map((p) => {
                const isSelected = selectedAvatar === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(p.id);
                      if (p.id !== "custom") {
                        setCustomPhoto(null);
                        saveStoredAvatar(p.id as AvatarPreset, null);
                      }
                    }}
                    className={cn(
                      "size-10 rounded-xl border flex flex-col items-center justify-center shrink-0 transition active:scale-95 relative",
                      isSelected
                        ? "border-teal-400 bg-teal-500/20 shadow-xs ring-2 ring-teal-400/30"
                        : "border-border/80 bg-card hover:bg-secondary/80",
                    )}
                  >
                    {p.type === "nido" ? (
                      <NidoCharacter className="size-7" />
                    ) : p.type === "toto" ? (
                      <TotoCharacter className="size-7" />
                    ) : p.type === "chispa" ? (
                      <ChispaCharacter className="size-7" />
                    ) : p.emoji ? (
                      <span className="text-sm">{p.emoji}</span>
                    ) : (
                      <span className="text-xs font-black text-amber-300">
                        {displayName.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. FORMULARIO DE DATOS: NOMBRE Y CORREO */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="displayName" className="text-xs font-bold text-foreground block">
                Nombre de Usuario o Apodo
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre en UALÍ…"
                  className="w-full h-11 px-3 rounded-xl bg-background border border-border/80 text-foreground text-xs font-bold focus:outline-hidden focus:border-teal-400 shadow-xs"
                />
                <Edit2 className="size-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="userEmail" className="text-xs font-bold text-foreground block">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="userEmail"
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/60 text-muted-foreground text-xs font-medium cursor-not-allowed"
                />
                <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Cuenta autenticada de forma segura con UALÍ.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{saving ? "Guardando…" : "Guardar Cambios"}</span>
            </button>
          </form>

          {/* 3. SECCIÓN SOCIAL: COMPARTE TU CONOCIMIENTO CON UALÍ */}
          <div className="pt-2 border-t border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-teal-400" />
                Comparte en Redes Sociales
              </span>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                Comunidad UALÍ
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              Comparte tu experiencia de cómo manejas tu dinero día a día e inspira a otros a vivir
              sin estrés financiero:
            </p>

            {/* Chips de temas para compartir */}
            <div className="grid grid-cols-2 gap-1.5">
              {SOCIAL_TIPS.map((tip) => {
                const isActive = tip.id === selectedTipId;
                return (
                  <button
                    key={tip.id}
                    type="button"
                    onClick={() => setSelectedTipId(tip.id)}
                    className={cn(
                      "p-2 rounded-xl border text-left transition active:scale-95",
                      isActive
                        ? "border-teal-400 bg-teal-500/15 text-foreground shadow-xs"
                        : "border-border/60 bg-secondary/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="text-[10px] font-bold text-teal-400 block">
                      {tip.category}
                    </span>
                    <span className="text-[11px] font-extrabold truncate block">{tip.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Caja de texto del tip */}
            <div className="p-3 rounded-2xl bg-secondary/80 border border-border/80 text-xs text-foreground/90 relative shadow-inner">
              <p className="italic leading-relaxed font-sans text-[11.5px]">
                "{activeTip.snippet}"
              </p>
            </div>

            {/* Botones de acción directa para compartir */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition"
              >
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                className="py-2 px-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-border/80 shadow-xs active:scale-95 transition"
              >
                <span>X / Twitter</span>
              </button>

              <button
                type="button"
                onClick={handleShareNative}
                className="py-2 px-2.5 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition"
              >
                <Share2 className="size-3.5" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
