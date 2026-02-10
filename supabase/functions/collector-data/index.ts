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
    const { token, action } = body;

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

    // Handle batch creation
    if (action === "create_batch") {
      // Get undelivered submissions without a batch
      const { data: unbatched, error: fetchErr } = await supabase
        .from("submissions")
        .select("id")
        .eq("collector_name", collectorName)
        .eq("is_delivered", false)
        .is("batch_id", null);

      if (fetchErr) {
        return new Response(
          JSON.stringify({ error: "حدث خطأ في جلب البيانات" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!unbatched || unbatched.length === 0) {
        return new Response(
          JSON.stringify({ error: "لا توجد تسجيلات غير مورّدة لإنشاء دفعة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current settings
      const { data: settings } = await supabase
        .from("system_settings")
        .select("key, value");

      const settingsMap: Record<string, string> = {};
      (settings || []).forEach((s: { key: string; value: string }) => {
        settingsMap[s.key] = s.value;
      });

      const svcPrice = parseFloat(settingsMap.service_price || "0");
      const commAmount = parseFloat(settingsMap.commission_amount || "0");
      const count = unbatched.length;
      const totalAmt = count * svcPrice;
      const totalComm = count * commAmount;
      const netAmt = totalAmt - totalComm;

      // Create the batch
      const { data: batch, error: batchErr } = await supabase
        .from("batches")
        .insert({
          collector_name: collectorName,
          submissions_count: count,
          total_amount: totalAmt,
          commission_amount: totalComm,
          net_amount: netAmt,
        })
        .select("id")
        .single();

      if (batchErr || !batch) {
        return new Response(
          JSON.stringify({ error: "حدث خطأ في إنشاء الدفعة" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Link submissions to batch
      const ids = unbatched.map((s: { id: string }) => s.id);
      const { error: updateErr } = await supabase
        .from("submissions")
        .update({ batch_id: batch.id })
        .in("id", ids);

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: "حدث خطأ في ربط التسجيلات بالدفعة" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, batch_id: batch.id, count }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: fetch data
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("id, full_name, phone_number, created_at, is_delivered, batch_id")
      .eq("collector_name", collectorName)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: "حدث خطأ في جلب البيانات" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch batches for this collector
    const { data: batches } = await supabase
      .from("batches")
      .select("*")
      .eq("collector_name", collectorName)
      .order("created_at", { ascending: false });

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
        batches: batches || [],
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
