import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Not authorized - admin role required')
    }

    // Get the employee data from the request
    const { full_name, email, role = 'employee', department, employee_id, password } = await req.json()
    
    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Create a Supabase Admin client to create the auth user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create user in auth system first with email already confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since confirmations are disabled
      user_metadata: {
        full_name,
        role
      }
    })

    if (authError) {
      console.error('Auth error details:', authError)
      throw new Error(`Error al crear usuario: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    console.log('Usuario creado exitosamente:', { userId: authData.user.id, email: authData.user.email })

    // Wait for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update the profile with additional details
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        department,
        employee_id,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Error actualizando perfil:', updateError)
      throw new Error(`Error al actualizar perfil: ${updateError.message}`)
    }

    console.log('Perfil actualizado correctamente')

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})