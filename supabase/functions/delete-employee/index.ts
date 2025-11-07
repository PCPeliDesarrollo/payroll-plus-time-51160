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

    // Check if user is admin or super_admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
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

    // Delete all related records first
    try {
      // Delete notifications
      await supabaseAdmin.from('notifications').delete().eq('user_id', employee_id)
      console.log('Notificaciones eliminadas')

      // Delete schedule changes
      await supabaseAdmin.from('schedule_changes').delete().eq('user_id', employee_id)
      console.log('Cambios de horario eliminados')

      // Delete vacation requests
      await supabaseAdmin.from('vacation_requests').delete().eq('user_id', employee_id)
      console.log('Solicitudes de vacaciones eliminadas')

      // Delete vacation balance
      await supabaseAdmin.from('vacation_balance').delete().eq('user_id', employee_id)
      console.log('Balance de vacaciones eliminado')

      // Delete compensatory days
      await supabaseAdmin.from('compensatory_days').delete().eq('user_id', employee_id)
      console.log('Días compensatorios eliminados')

      // Delete time entries
      await supabaseAdmin.from('time_entries').delete().eq('user_id', employee_id)
      console.log('Fichajes eliminados')

      // Delete payroll records
      await supabaseAdmin.from('payroll_records').delete().eq('user_id', employee_id)
      console.log('Registros de nómina eliminados')

      // Delete user roles
      await supabaseAdmin.from('user_roles').delete().eq('user_id', employee_id)
      console.log('Roles de usuario eliminados')

      // Delete profile
      await supabaseAdmin.from('profiles').delete().eq('id', employee_id)
      console.log('Perfil eliminado')

    } catch (deleteError) {
      console.error('Error eliminando registros relacionados:', deleteError)
      const errorMsg = deleteError instanceof Error ? deleteError.message : 'Error desconocido'
      throw new Error(`Error al eliminar registros relacionados: ${errorMsg}`)
    }

    // Finally delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(employee_id)

    if (authError) {
      console.error('Error eliminando usuario de auth:', authError)
      throw new Error(`Error al eliminar usuario: ${authError.message}`)
    }

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
