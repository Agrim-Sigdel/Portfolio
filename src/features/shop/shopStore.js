import { supabase } from '../../shared/lib/supabaseClient';
import { campaignValue, validateProduct } from './shopModel.mjs';

export async function loadProducts(admin = false) {
  if (!supabase) throw new Error('The shop connection is not configured. Please try again later.');
  let query = supabase.from('shop_products').select('*').order('sort_order').order('slug');
  if (!admin) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) throw new Error('The product catalogue could not be loaded. Please retry.');
  return data;
}

export async function saveProduct(product, originalSlug) {
  const issue = validateProduct(product);
  if (issue) throw new Error(issue);
  const row = { ...product, sort_order: Number(product.sort_order), updated_at: new Date().toISOString() };
  delete row.created_at;
  const query = originalSlug
    ? supabase.from('shop_products').update(row).eq('slug', originalSlug)
    : supabase.from('shop_products').insert(row);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.code === '23505' ? 'That slug already exists. Choose another.' : 'Could not save. Check your admin access and shop database setup.');
  return data;
}

export function trackShop(event, productSlug = '') {
  if (!supabase || navigator.doNotTrack === '1' || navigator.globalPrivacyControl || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
  const params = new URLSearchParams(window.location.search);
  // No cookies, persistent identifier, full referrer, or full URL is stored.
  // Analytics must never interrupt navigation or downloading.
  void fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/record_shop_event`, {
    method: 'POST',
    // Preserve checkout/download events when this tab immediately navigates away.
    keepalive: true,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_event: event,
      p_slug: productSlug,
      p_source: campaignValue(params.get('utm_source')),
      p_campaign: campaignValue(params.get('utm_campaign')),
    }),
  }).catch(() => {});
}

export async function loadShopStats() {
  const { data, error } = await supabase.rpc('shop_stats');
  if (error) throw new Error('Analytics unavailable. Check your admin access and shop migration.');
  return data;
}
