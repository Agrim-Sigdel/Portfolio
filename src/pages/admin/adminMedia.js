import { supabase } from '../../shared/lib/supabaseClient';

/*
 * Storage service over the public `media` bucket (created in SETUP.md step 5).
 * Public read is automatic; writes require the authenticated admin session.
 *
 * Files live flat at the bucket root — no folders — so one list() call shows
 * everything and names double as stable public URLs.
 */

const BUCKET = 'media';

/** Fixed slot for the CV so replacing it keeps a stable path (upsert). */
export const CV_STORAGE_PATH = 'AgrimSigdel-CV.pdf';

const bucket = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase.storage.from(BUCKET);
};

export const publicUrlFor = (name) => bucket().getPublicUrl(name).data.publicUrl;

/** List bucket files, newest first: [{name, size, updatedAt, publicUrl}]. */
export async function listMedia() {
  const { data, error } = await bucket().list('', {
    limit: 200,
    sortBy: { column: 'updated_at', order: 'desc' },
  });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((f) => f.id) // folders come back without an id; we keep the bucket flat anyway
    .map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      updatedAt: f.updated_at,
      publicUrl: publicUrlFor(f.name),
    }));
}

/** Upload (or replace) a file; returns its public URL. */
export async function uploadMedia(file, path = file.name) {
  const { error } = await bucket().upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  return publicUrlFor(path);
}

export async function deleteMedia(name) {
  const { error } = await bucket().remove([name]);
  if (error) throw new Error(error.message);
}
