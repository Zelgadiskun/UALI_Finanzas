import { useState } from "react";
import { BookOpen } from "lucide-react";
import { LessonSheet } from "./LessonSheet";
import { useLessonsQuery, useProgressQuery } from "@/lib/supabase/queries";

/**
 * Antes, "avalancha"/"bola de nieve"/"0-base" se explicaban dos veces —
 * una frase suelta en la pantalla donde aparece el concepto, y otra vez
 * completa en la lección — sin que una supiera de la otra. Esto reemplaza
 * la duplicación por un link a la única fuente real: si la lección no
 * existe todavía (o no cargó), no renderiza nada — nunca un link roto.
 */
export function LessonLink({ slug, label = "¿Por qué?" }: { slug: string; label?: string }) {
  const lessonsQuery = useLessonsQuery();
  const progressQuery = useProgressQuery();
  const [open, setOpen] = useState(false);
  const lesson = lessonsQuery.data?.find((l) => l.slug === slug);

  if (!lesson) return null;
  const done = progressQuery.data?.lessonsDone.includes(lesson.id) ?? false;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary"
      >
        <BookOpen className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {label}
      </button>
      {open && <LessonSheet lesson={lesson} done={done} onClose={() => setOpen(false)} />}
    </>
  );
}
