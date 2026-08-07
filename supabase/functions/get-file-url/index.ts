import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function b2Authorize() {
  const credentials = btoa(`${Deno.env.get("B2_KEY_ID")}:${Deno.env.get("B2_APP_KEY")}`)
  const res = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error("Lỗi xác thực B2: " + await res.text())
  return res.json()
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Chưa đăng nhập" }), { status: 401, headers: corsHeaders })
    }

    const { key } = await req.json()
    if (!key) {
      return new Response(JSON.stringify({ error: "Thiếu key" }), { status: 400, headers: corsHeaders })
    }

    const authData = await b2Authorize()
    const bucketId = Deno.env.get("B2_BUCKET_ID")!
    const bucketName = Deno.env.get("B2_BUCKET")!

    const downloadAuthRes = await fetch(`${authData.apiInfo.storageApi.apiUrl}/b2api/v3/b2_get_download_authorization`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId, fileNamePrefix: key, validDurationInSeconds: 900 }),
    })
    if (!downloadAuthRes.ok) throw new Error("Lỗi lấy download auth: " + await downloadAuthRes.text())
    const downloadAuthData = await downloadAuthRes.json()

    const url = `${authData.apiInfo.storageApi.downloadUrl}/file/${bucketName}/${encodeURIComponent(key)}?Authorization=${downloadAuthData.authorizationToken}`

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})