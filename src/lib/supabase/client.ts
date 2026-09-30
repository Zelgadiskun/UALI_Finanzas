import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = import.meta.env["VITE_SUPABASE_URL"] || "https://placeholder-project.supabase.co";
const anonKey =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIn0.dummy";

if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
  console.warn(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copiá .env.example a .env y completá los valores del proyecto de Supabase.",
  );
}

export const supabase = createClient<Database>(url, anonKey);
