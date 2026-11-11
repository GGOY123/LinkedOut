import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";

let cachedClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Trả về instance SupabaseClient dùng cho các thao tác đọc/ghi dữ liệu server-side
 * Sử dụng NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Nếu chưa cấu hình biến môi trường, trả về null để tầng gọi xử lý an toàn.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

/**
 * Trả về Supabase Admin Client với quyền service_role (dành riêng cho các tác vụ quản trị,
 * ví dụ: đọc toàn bộ báo cáo vi phạm được bảo vệ bởi RLS).
 * Nếu không có SUPABASE_SERVICE_ROLE_KEY, fallback về getSupabaseClient().
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) return null;
  if (!serviceKey) return getSupabaseClient();

  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}
