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
      throw new Error('Tu sesión ha expirado. Vuelve a iniciar sesión.')
    }

    // Check if user is admin or super_admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      throw new Error('No tienes permisos para crear usuarios')
    }

    // Get the employee data from the request
    const { full_name, email, role = 'employee', department, employee_id, phone, password, company_id } = await req.json()
    
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
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        full_name,
        role,
        department,
        employee_id,
        phone,
        company_id
      }
    })

    console.log('Intentando crear usuario:', { email, role, full_name })

    if (authError) {
      console.error('Auth error details:', authError)
      const authMsg = authError.message || ''
      let userMessage = `Error al crear usuario: ${authMsg}`
      if (authMsg.toLowerCase().includes('weak_password') || authMsg.toLowerCase().includes('known to be weak') || authError.code === 'weak_password') {
        userMessage = 'La contraseña es demasiado débil: es muy común o ha aparecido en filtraciones conocidas. Elige una de al menos 8 caracteres combinando mayúsculas, minúsculas, números y símbolos (ej. Peli#2026x).'
      } else if (authMsg.toLowerCase().includes('already registered') || authMsg.toLowerCase().includes('already been registered')) {
        userMessage = 'Este email ya está registrado. Usa otro email diferente.'
      } else if (authMsg.toLowerCase().includes('at least 6 characters')) {
        userMessage = 'La contraseña debe tener al menos 6 caracteres.'
      } else if (authMsg.toLowerCase().includes('unable to validate email')) {
        userMessage = 'El formato del email no es válido.'
      }
      throw new Error(userMessage)
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    console.log('Usuario creado exitosamente:', { userId: authData.user.id, email: authData.user.email })

    // Wait for the trigger to create the profile and user_roles entry
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update the profile with additional details
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        department,
        employee_id,
        phone,
        company_id,
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
    // IMPORTANTE: Devolver 200 con success: false para que el cliente pueda leer el error
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})