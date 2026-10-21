// Supabase Edge Function: leads-webhook
// Receives validated lead/quote submissions from TriYantra Next.js backend and persists them to the leads table.
//
// Contract:
// - Method: POST
// - Headers: Authorization: Bearer <token>, Idempotency-Key: <requestId>
// - Response: {"accepted": true} with status 200

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
};

interface LeadPayload {
  kind: "quote" | "demo";
  requestId: string;
  fullName: string;
  workEmail: string;
  companyName: string;
  phone?: string;
  employees?: string;
  devices?: string;
  requirementType?: string;
  deviceType?: string;
  locations?: string;
  startDate?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ accepted: false, error: "Method Not Allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 1. Authorization: If LEAD_WEBHOOK_SECRET is set, enforce custom secret.
  // Otherwise, Supabase's native API Gateway validates the Bearer JWT token.
  const customSecret = Deno.env.get("LEAD_WEBHOOK_SECRET");
  if (customSecret) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (token !== customSecret) {
      return new Response(
        JSON.stringify({ accepted: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  // 2. Parse JSON body
  let payload: LeadPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ accepted: false, error: "Invalid JSON" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!payload.requestId || !payload.fullName || !payload.workEmail || !payload.companyName) {
    return new Response(
      JSON.stringify({ accepted: false, error: "Missing required fields" }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 3. Connect to Supabase Database using internal environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 4. Idempotently insert/upsert using request_id
  const { error } = await supabase.from("leads").upsert(
    {
      request_id: payload.requestId,
      kind: payload.kind,
      full_name: payload.fullName,
      work_email: payload.workEmail,
      company_name: payload.companyName,
      phone: payload.phone?.trim() || null,
      employees: payload.employees?.trim() || null,
      devices: payload.devices?.trim() || null,
      requirement_type: payload.requirementType?.trim() || null,
      device_type: payload.deviceType?.trim() || null,
      locations: payload.locations?.trim() || null,
      start_date: payload.startDate?.trim() || null,
      message: payload.message?.trim() || null,
    },
    { onConflict: "request_id" },
  );

  if (error) {
    console.error("Database insert error:", error);
    return new Response(
      JSON.stringify({ accepted: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 5. Respond with { accepted: true } required by TriYantra delivery client
  return new Response(
    JSON.stringify({ accepted: true }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
