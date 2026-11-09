import { createClient } from 'npm:@supabase/supabase-js@2.110.8';
import { createShopAdminHandler } from '../_shared/shop-admin-handler.mjs';

const env = {
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  DODO_PAYMENTS_TEST_API_KEY: Deno.env.get('DODO_PAYMENTS_TEST_API_KEY') || '',
  DODO_PAYMENTS_LIVE_API_KEY: Deno.env.get('DODO_PAYMENTS_LIVE_API_KEY') || '',
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createShopAdminHandler({db,env}));
