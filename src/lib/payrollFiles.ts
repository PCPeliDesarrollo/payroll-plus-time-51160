import { supabase } from "@/integrations/supabase/client";

const BUCKET = "payroll-files";

/**
 * Extracts the storage path inside the `payroll-files` bucket from either
 * a stored public URL or an already-relative path.
 */
export function extractPayrollPath(fileUrl: string): string {
  if (!fileUrl) return "";
  const marker = `/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) {
    return fileUrl.substring(idx + marker.length).split("?")[0];
  }
  // Already a path
  return fileUrl.replace(/^\/+/, "").split("?")[0];
}

/**
 * Generates a short-lived signed URL for a payroll file. The bucket is
 * private, so direct public URLs no longer work.
 */
export async function getPayrollSignedUrl(
  fileUrl: string,
  expiresInSeconds = 300
): Promise<string> {
  const path = extractPayrollPath(fileUrl);
  if (!path) throw new Error("Ruta de archivo no válida");
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("No se pudo generar el enlace de descarga");
  }
  return data.signedUrl;
}
