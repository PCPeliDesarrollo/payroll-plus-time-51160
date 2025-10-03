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
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      throw new Error('No autenticado')
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('No autorizado - se requiere rol de administrador')
    }

    // Get the employee ID from the request
    const { employee_id } = await req.json()
    
    if (!employee_id) {
      throw new Error('ID de empleado requerido')
    }

    // Create a Supabase Admin client to delete the user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Iniciando eliminación del empleado:', employee_id)

    // Delete from profiles table first (this allows auth deletion to proceed)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', employee_id)

    if (profileError) {
      console.error('Error eliminando perfil:', profileError)
      // Continue anyway, try to delete auth user
    } else {
      console.log('Perfil eliminado correctamente')
    }

    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(employee_id)

    if (authError) {
      console.error('Error eliminando usuario de auth:', authError)
      throw new Error(`Error al eliminar usuario: ${authError.message}`)
    }

    console.log('Usuario de auth eliminado correctamente')

    console.log('Empleado eliminado exitosamente:', employee_id)

    return new Response(
      JSON.stringify({ success: true, message: 'Empleado eliminado correctamente' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
