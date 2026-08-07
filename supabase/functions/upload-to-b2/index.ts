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

    const formData = await req.formData()
    const file = formData.get("file") as File
    const taskId = formData.get("taskId") as string
    if (!file || !taskId) {
      return new Response(JSON.stringify({ error: "Thiếu file hoặc taskId" }), { status: 400, headers: corsHeaders })
    }

    const authData = await b2Authorize()
    const bucketId = Deno.env.get("B2_BUCKET_ID")!

    const uploadUrlRes = await fetch(`${authData.apiInfo.storageApi.apiUrl}/b2api/v3/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId }),
    })
    if (!uploadUrlRes.ok) throw new Error("Lỗi lấy upload URL: " + await uploadUrlRes.text())
    const uploadUrlData = await uploadUrlRes.json()

    const ext = file.name.split(".").pop()
    const key = `${taskId}/${Date.now()}.${ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())

    const uploadRes = await fetch(uploadUrlData.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadUrlData.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(key),
        "Content-Type": file.type || "b2/x-auto",
        "X-Bz-Content-Sha1": "do_not_verify",
        "Content-Length": String(bytes.length),
      },
      body: bytes,
    })
    if (!uploadRes.ok) throw new Error("Upload B2 thất bại: " + await uploadRes.text())

    return new Response(JSON.stringify({ key }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})