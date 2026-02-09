import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifyToken(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const [dataB64, sigB64] = token.split(".");
    const data = decodeURIComponent(escape(atob(dataB64)));
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sig,
      encoder.encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(data);
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "التوكن مطلوب" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyToken(token, serviceRoleKey);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "جلسة غير صالحة أو منتهية" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const collectorName = payload.collector_name as string;

    // Fetch submissions for this collector (include is_delivered)
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("id, full_name, phone_number, created_at, is_delivered")
      .eq("collector_name", collectorName)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: "حدث خطأ في جلب البيانات" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value");

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    return new Response(
      JSON.stringify({
        collector_name: collectorName,
        submissions: submissions || [],
        total: (submissions || []).length,
        service_price: parseFloat(settingsMap.service_price || "0"),
        commission_amount: parseFloat(settingsMap.commission_amount || "0"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "حدث خطأ داخلي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
