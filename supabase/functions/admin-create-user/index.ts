import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    const { email, cpf, nome, permissao, setor } = await req.json()

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
        // Supabase API URL - env var exported by default.
        Deno.env.get('SUPABASE_URL') ?? '',
        // Supabase API ANON KEY - env var exported by default.
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        // Create client with Auth context of the user that called the function.
        // This way your row-level-security (RLS) policies are applied.
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if the user is an Admin
    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // We need to check the public.usuarios table for permission
    const { data: adminUser } = await supabaseClient
        .from('usuarios')
        .select('permissao')
        .eq('id', user.id)
        .single()

    if (adminUser?.permissao !== 'Adm') {
        return new Response(JSON.stringify({ error: 'Forbidden: Only Admins can create users' }), { status: 403 })
    }

    // Now create the new user using SERVICE_ROLE key because we are creating an Auth User
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: cpf, // Password is CPF as requested
        email_confirm: true,
        user_metadata: { nome, cpf, permissao, setor } // Trigger will handle the rest
    })

    if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
    }

    return new Response(
        JSON.stringify({ data: newUser, message: 'User created successfully' }),
        { headers: { "Content-Type": "application/json" } },
    )
})
