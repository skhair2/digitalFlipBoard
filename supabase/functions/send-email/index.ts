import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

        if (!RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY environment variable')
        }

        const resend = new Resend(RESEND_API_KEY)
        const { to, subject, html, text } = await req.json()

        if (!to || !subject || !html) {
            throw new Error('Missing required fields: to, subject, html')
        }

        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
            text,
        })

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
