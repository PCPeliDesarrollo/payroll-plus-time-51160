# TESTING COMPLETO - ROL ADMIN

## 📋 INFORMACIÓN GENERAL
- **Rol:** Admin
- **Fecha:** 2025-11-07
- **Company_id:** Debe tener un company_id asignado

---

## 🔐 1. VERIFICACIÓN DE POLÍTICAS RLS

### 1.1 Tabla: profiles
- [ ] ✅ Puede ver todos los perfiles de su company_id
- [ ] ❌ NO puede ver perfiles de otras compañías
- [ ] ✅ Puede editar perfiles de empleados de su compañía
- [ ] ✅ Puede crear nuevos empleados en su compañía
- [ ] ✅ Puede desactivar empleados (is_active = false)
- [ ] ❌ NO puede ver/editar super_admins

### 1.2 Tabla: time_entries
- [ ] ✅ Puede ver todos los fichajes de su company_id
- [ ] ❌ NO puede ver fichajes de otras compañías
- [ ] ✅ Puede crear fichajes para empleados de su compañía
- [ ] ✅ Puede editar fichajes existentes
- [ ] ✅ Puede eliminar fichajes

### 1.3 Tabla: vacation_requests
- [ ] ✅ Puede ver todas las solicitudes de su company_id
- [ ] ❌ NO puede ver solicitudes de otras compañías
- [ ] ✅ Puede aprobar solicitudes pendientes
- [ ] ✅ Puede rechazar solicitudes pendientes
- [ ] ✅ Puede eliminar solicitudes
- [ ] ✅ Puede editar solicitudes (cambiar fechas, días)
- [ ] ✅ Al aprobar, se actualiza vacation_balance automáticamente
- [ ] ✅ Al rechazar aprobación, se restaura vacation_balance

### 1.4 Tabla: vacation_balance
- [ ] ✅ Puede ver balances de su company_id
- [ ] ❌ NO puede ver balances de otras compañías
- [ ] ✅ Puede editar balances (ajustar días)
- [ ] ✅ Los cambios se reflejan correctamente

### 1.5 Tabla: compensatory_days
- [ ] ✅ Puede ver días compensatorios de su company_id
- [ ] ❌ NO puede ver días de otras compañías
- [ ] ✅ Puede crear días compensatorios para empleados
- [ ] ✅ Puede eliminar días compensatorios
- [ ] ✅ Al crear, se especifica granted_by correctamente

### 1.6 Tabla: schedule_changes
- [ ] ✅ Puede ver todas las solicitudes de su company_id
- [ ] ❌ NO puede ver solicitudes de otras compañías
- [ ] ✅ Puede aprobar solicitudes pendientes
- [ ] ✅ Puede rechazar solicitudes pendientes
- [ ] ✅ Puede agregar comentarios de admin
- [ ] ❌ NO puede eliminar solicitudes (según RLS)
- [ ] ✅ Al aprobar, se actualiza/crea el time_entry correspondiente

### 1.7 Tabla: payroll_records
- [ ] ✅ Puede ver todas las nóminas de su company_id
- [ ] ❌ NO puede ver nóminas de otras compañías
- [ ] ✅ Puede crear nóminas borrador
- [ ] ✅ Puede subir PDFs de nómina
- [ ] ✅ Puede eliminar nóminas
- [ ] ✅ Al subir PDF, status cambia a 'approved'

### 1.8 Tabla: notifications
- [ ] ✅ Recibe notificaciones cuando empleados solicitan vacaciones
- [ ] ✅ Recibe notificaciones cuando empleados solicitan cambios de horario
- [ ] ✅ Puede marcar notificaciones como leídas
- [ ] ❌ NO puede eliminar notificaciones (según RLS)

### 1.9 Tabla: companies
- [ ] ✅ Puede ver información de su propia compañía
- [ ] ❌ NO puede ver otras compañías
- [ ] ❌ NO puede editar información de compañía (solo super_admin)

### 1.10 Tabla: user_roles
- [ ] ✅ Puede ver roles de usuarios de su compañía
- [ ] ✅ La función has_role() funciona correctamente
- [ ] ✅ La función get_user_company_id() retorna su company_id

---

## 🧪 2. PRUEBAS FUNCIONALES POR MÓDULO

### 2.1 AUTENTICACIÓN Y ACCESO

#### Login
- [ ] ✅ Puede iniciar sesión con email y password
- [ ] ✅ Después de login, se redirige al Dashboard
- [ ] ✅ El rol se identifica correctamente como 'admin'

#### Permisos de Navegación
- [ ] ✅ Puede acceder a Dashboard
- [ ] ✅ Puede acceder a "Empleados"
- [ ] ✅ Puede acceder a "Fichajes"
- [ ] ✅ Puede acceder a "Vacaciones"
- [ ] ✅ Puede acceder a "Cambios de Horario"
- [ ] ✅ Puede acceder a "Nóminas"
- [ ] ✅ Puede acceder a "Regularización"
- [ ] ✅ Puede acceder a "Ajustes"
- [ ] ❌ NO puede acceder a "Panel Super Admin"
- [ ] ❌ NO puede ver opciones de super admin en el menú

---

### 2.2 DASHBOARD (Admin)

#### Estadísticas Visibles
- [ ] ✅ Total de empleados de su compañía
- [ ] ✅ Empleados activos hoy
- [ ] ✅ Solicitudes pendientes (vacaciones + cambios)
- [ ] ✅ Horas trabajadas este mes (total compañía)

#### Notificaciones
- [ ] ✅ Se muestran notificaciones sin leer
- [ ] ✅ Badge con número de notificaciones
- [ ] ✅ Puede marcar como leídas
- [ ] ✅ Notificaciones de solicitudes de vacaciones
- [ ] ✅ Notificaciones de cambios de horario

#### Accesos Rápidos
- [ ] ✅ Botón "Ver Empleados" funciona
- [ ] ✅ Botón "Ver Fichajes" funciona
- [ ] ✅ Botón "Gestionar Vacaciones" funciona
- [ ] ✅ Botón "Ver Solicitudes" funciona

---

### 2.3 GESTIÓN DE EMPLEADOS

#### Listado de Empleados
- [ ] ✅ Se muestran solo empleados de su company_id
- [ ] ❌ NO se muestran empleados de otras compañías
- [ ] ✅ Búsqueda por nombre funciona
- [ ] ✅ Se muestra avatar, nombre, rol, email, teléfono
- [ ] ✅ Se muestra fecha de contratación
- [ ] ✅ Se muestra estado (Activo/Inactivo)

#### Crear Empleado
- [ ] ✅ Botón "Crear Empleado" visible
- [ ] ✅ Dialog se abre correctamente
- [ ] ✅ Campos requeridos: Nombre completo, Email, Contraseña
- [ ] ✅ Campos opcionales: ID Empleado, Departamento, Rol
- [ ] ✅ Al crear, se asigna automáticamente company_id del admin
- [ ] ✅ Se crea usuario en auth.users
- [ ] ✅ Se crea perfil en profiles
- [ ] ✅ Se crea vacation_balance (22 días)
- [ ] ✅ Se crea user_role
- [ ] ✅ Validación: Email duplicado muestra error
- [ ] ✅ Validación: Employee_id duplicado muestra error
- [ ] ✅ Toast de éxito al crear
- [ ] ✅ Lista se actualiza automáticamente

#### Editar Empleado
- [ ] ✅ Opción "Editar" en menú de empleado
- [ ] ✅ Dialog de edición se abre con datos actuales
- [ ] ✅ Puede cambiar nombre, departamento, rol
- [ ] ✅ Puede cambiar teléfono, employee_id
- [ ] ❌ NO puede cambiar email (auth)
- [ ] ✅ Cambios se guardan correctamente
- [ ] ✅ Toast de éxito al guardar

#### Ver Perfil
- [ ] ✅ Opción "Ver perfil" disponible
- [ ] ✅ Muestra toda la información del empleado
- [ ] ✅ Muestra datos de contacto
- [ ] ✅ Muestra fecha de contratación

#### Ver Check-ins
- [ ] ✅ Opción "Ver check-ins" disponible
- [ ] ✅ Muestra fichajes del empleado
- [ ] ✅ Información completa de cada fichaje

#### Desactivar Empleado
- [ ] ✅ Opción "Desactivar" en menú
- [ ] ✅ Confirmación antes de desactivar
- [ ] ✅ is_active cambia a false
- [ ] ✅ Empleado desaparece de lista activos
- [ ] ✅ Toast de confirmación

#### Eliminar Empleado Permanentemente
- [ ] ✅ Opción "Eliminar permanentemente" disponible
- [ ] ✅ Confirmación con advertencia clara
- [ ] ✅ Se eliminan notificaciones del empleado
- [ ] ✅ Se eliminan schedule_changes
- [ ] ✅ Se eliminan vacation_requests
- [ ] ✅ Se elimina vacation_balance
- [ ] ✅ Se eliminan compensatory_days
- [ ] ✅ Se eliminan time_entries
- [ ] ✅ Se eliminan payroll_records
- [ ] ✅ Se eliminan user_roles
- [ ] ✅ Se elimina profile
- [ ] ✅ Se elimina de auth.users
- [ ] ✅ Toast de confirmación
- [ ] ✅ Lista se actualiza

---

### 2.4 GESTIÓN DE FICHAJES (Admin Attendance)

#### Listado de Empleados
- [ ] ✅ Se muestran empleados de su company_id
- [ ] ✅ Búsqueda funciona
- [ ] ✅ Click en empleado muestra sus fichajes

#### Vista de Fichajes por Empleado
- [ ] ✅ Selector de mes funciona
- [ ] ✅ Se muestran fichajes del mes seleccionado
- [ ] ✅ Por cada fichaje se muestra:
  - [ ] Fecha
  - [ ] Hora de entrada
  - [ ] Hora de salida
  - [ ] Coordenadas entrada/salida
  - [ ] Duración total
  - [ ] Estado (checked_in/checked_out/incomplete)
- [ ] ✅ Botón copiar coordenadas funciona
- [ ] ✅ Estados tienen badge con color correcto
- [ ] ✅ Formato de tiempo correcto (HH:MM)
- [ ] ✅ Duración calculada correctamente (Xh Ym)

#### Navegación
- [ ] ✅ Botón "Volver" regresa a lista empleados
- [ ] ✅ Se puede cambiar entre meses
- [ ] ✅ Loading states funcionan

---

### 2.5 GESTIÓN DE VACACIONES (Admin Vacations)

#### Búsqueda de Empleados
- [ ] ✅ Buscador funciona
- [ ] ✅ Filtra por nombre
- [ ] ✅ Se muestran empleados con badges de estado:
  - [ ] Pendiente (amarillo)
  - [ ] Aprobado (verde)
  - [ ] Rechazado (rojo)
- [ ] ✅ Click en empleado abre detalle

#### Vista de Detalle de Empleado
- [ ] ✅ Muestra información del empleado
- [ ] ✅ Muestra balance de vacaciones:
  - [ ] Total de días
  - [ ] Días usados
  - [ ] Días restantes
  - [ ] Días compensatorios
- [ ] ✅ Lista de solicitudes de vacaciones
- [ ] ✅ Por cada solicitud:
  - [ ] Fechas (inicio - fin)
  - [ ] Total de días
  - [ ] Razón
  - [ ] Estado
  - [ ] Fecha de solicitud

#### Aprobar Solicitud
- [ ] ✅ Botón "Aprobar" visible en pendientes
- [ ] ✅ Confirmación antes de aprobar
- [ ] ✅ Estado cambia a 'approved'
- [ ] ✅ approved_by se registra (admin id)
- [ ] ✅ approved_at se registra
- [ ] ✅ vacation_balance se actualiza:
  - [ ] used_days aumenta
  - [ ] remaining_days disminuye
- [ ] ✅ Empleado recibe notificación
- [ ] ✅ Toast de éxito

#### Rechazar Solicitud
- [ ] ✅ Botón "Rechazar" visible en pendientes
- [ ] ✅ Confirmación antes de rechazar
- [ ] ✅ Estado cambia a 'rejected'
- [ ] ✅ approved_by se registra
- [ ] ✅ approved_at se registra
- [ ] ✅ vacation_balance NO se modifica
- [ ] ✅ Empleado recibe notificación
- [ ] ✅ Toast de éxito

#### Eliminar Solicitud
- [ ] ✅ Botón "Eliminar" disponible
- [ ] ✅ Confirmación antes de eliminar
- [ ] ✅ Si estaba aprobada, vacation_balance se restaura
- [ ] ✅ Solicitud se elimina de BD
- [ ] ✅ Toast de confirmación
- [ ] ✅ Vista se actualiza

#### Editar Solicitud
- [ ] ✅ Botón "Editar" disponible
- [ ] ✅ Dialog de edición se abre
- [ ] ✅ Puede cambiar fechas
- [ ] ✅ Total de días se recalcula automáticamente
- [ ] ✅ Puede cambiar estado
- [ ] ✅ Si estaba aprobada y se cambia:
  - [ ] Balance se recalcula correctamente
- [ ] ✅ Validación: No permite solapamiento de fechas
- [ ] ✅ Toast de éxito

#### Agregar Días Compensatorios
- [ ] ✅ Botón "Agregar días compensatorios" visible
- [ ] ✅ Dialog se abre correctamente
- [ ] ✅ Campos: Fecha, Razón, Número de días
- [ ] ✅ Al guardar:
  - [ ] Se crea registro en compensatory_days
  - [ ] granted_by = admin id
  - [ ] company_id se asigna
- [ ] ✅ Total de días compensatorios se actualiza
- [ ] ✅ Toast de éxito

---

### 2.6 GESTIÓN DE CAMBIOS DE HORARIO

#### Listado de Solicitudes
- [ ] ✅ Se muestran todas las solicitudes de company_id
- [ ] ✅ Agrupadas por estado:
  - [ ] Pendientes
  - [ ] Aprobadas
  - [ ] Rechazadas
- [ ] ✅ Por cada solicitud se muestra:
  - [ ] Nombre del empleado
  - [ ] Fecha solicitada
  - [ ] Horario actual (entrada/salida)
  - [ ] Horario solicitado
  - [ ] Razón
  - [ ] Estado con badge
  - [ ] Comentarios de admin (si hay)

#### Aprobar Cambio
- [ ] ✅ Botón "Aprobar" en solicitudes pendientes
- [ ] ✅ Dialog de confirmación
- [ ] ✅ Puede agregar comentarios de admin
- [ ] ✅ Al aprobar:
  - [ ] Estado cambia a 'approved'
  - [ ] approved_by = admin id
  - [ ] approved_at se registra
  - [ ] admin_comments se guarda
  - [ ] Se actualiza/crea time_entry correspondiente:
    - [ ] check_in_time actualizado
    - [ ] check_out_time actualizado
- [ ] ✅ Empleado recibe notificación
- [ ] ✅ Toast de éxito

#### Rechazar Cambio
- [ ] ✅ Botón "Rechazar" en solicitudes pendientes
- [ ] ✅ Dialog de confirmación
- [ ] ✅ Puede agregar comentarios de admin
- [ ] ✅ Al rechazar:
  - [ ] Estado cambia a 'rejected'
  - [ ] approved_by = admin id
  - [ ] approved_at se registra
  - [ ] admin_comments se guarda
  - [ ] time_entry NO se modifica
- [ ] ✅ Empleado recibe notificación
- [ ] ✅ Toast de éxito

---

### 2.7 GESTIÓN DE NÓMINAS (Admin Payroll)

#### Listado de Empleados
- [ ] ✅ Se muestran empleados de company_id
- [ ] ✅ Búsqueda funciona
- [ ] ✅ Click en empleado muestra historial de nóminas

#### Vista de Nóminas por Empleado
- [ ] ✅ Muestra información del empleado
- [ ] ✅ Lista de registros de nómina ordenada
- [ ] ✅ Por cada registro:
  - [ ] Periodo (mes/año)
  - [ ] Salario base
  - [ ] Bonos
  - [ ] Deducciones
  - [ ] Salario neto
  - [ ] Estado (draft/approved)
  - [ ] Fecha de creación

#### Crear Nueva Nómina
- [ ] ✅ Botón "Crear nueva nómina" visible
- [ ] ✅ Dialog se abre
- [ ] ✅ Selectores de mes y año
- [ ] ✅ Validación: No duplicar periodo
- [ ] ✅ Al crear:
  - [ ] Se crea registro con status 'draft'
  - [ ] company_id asignado
  - [ ] created_by = admin id
  - [ ] Valores por defecto en 0
- [ ] ✅ Toast de éxito
- [ ] ✅ Lista se actualiza

#### Subir PDF de Nómina
- [ ] ✅ Botón "Subir nómina" disponible para drafts
- [ ] ✅ Solo acepta archivos PDF
- [ ] ✅ Validación de tipo de archivo
- [ ] ✅ Upload a storage bucket 'payroll-files'
- [ ] ✅ Ruta correcta: {company_id}/{user_id}/{filename}
- [ ] ✅ file_url se actualiza en registro
- [ ] ✅ status cambia a 'approved'
- [ ] ✅ Toast de éxito
- [ ] ✅ Botones cambian (Ver/Descargar disponibles)

#### Ver PDF de Nómina
- [ ] ✅ Botón "Ver nómina" disponible si hay file_url
- [ ] ✅ Abre PDF en nueva pestaña
- [ ] ✅ URL pública funciona

#### Descargar PDF
- [ ] ✅ Botón "Descargar" disponible
- [ ] ✅ Descarga el PDF correctamente
- [ ] ✅ Nombre de archivo apropiado

#### Eliminar Nómina
- [ ] ✅ Botón "Eliminar" disponible
- [ ] ✅ Confirmación antes de eliminar
- [ ] ✅ Si hay archivo, se elimina de storage
- [ ] ✅ Registro se elimina de BD
- [ ] ✅ Toast de confirmación
- [ ] ✅ Lista se actualiza

---

### 2.8 REGULARIZACIÓN AUTOMÁTICA

#### Interfaz
- [ ] ✅ Selector de empleado visible
- [ ] ✅ Lista de empleados activos
- [ ] ✅ Botón "Ejecutar Regularización Automática"

#### Proceso de Regularización
- [ ] ✅ Validación: Empleado seleccionado
- [ ] ✅ Loading state durante proceso
- [ ] ✅ Cálculo de horas trabajadas del mes correcto
- [ ] ✅ Cálculo de horas faltantes (160 - trabajadas)
- [ ] ✅ Identificación de días laborables sin fichaje
- [ ] ✅ Creación de time_entries automáticos:
  - [ ] Solo en días sin fichaje
  - [ ] Horario 09:00 - 17:00 (8h)
  - [ ] status = 'checked_out'
  - [ ] user_id correcto
  - [ ] company_id correcto
  - [ ] date correcta
- [ ] ✅ Respeta máximo de horas a regularizar
- [ ] ✅ Toast con resumen de operación
- [ ] ✅ Manejo de errores correcto

#### Validaciones
- [ ] ❌ NO regulariza más horas de las faltantes
- [ ] ❌ NO crea fichajes en días con fichaje existente
- [ ] ❌ NO crea fichajes en fines de semana
- [ ] ✅ Solo procesa mes actual

---

### 2.9 AJUSTES (Admin Settings)

#### Información de Perfil
- [ ] ✅ Muestra nombre completo del admin
- [ ] ✅ Muestra email
- [ ] ✅ Muestra rol: admin
- [ ] ✅ Muestra departamento (si tiene)

#### Cambiar Contraseña
- [ ] ✅ Formulario visible
- [ ] ✅ Campo "Nueva contraseña"
- [ ] ✅ Campo "Confirmar contraseña"
- [ ] ✅ Validación: Contraseñas coinciden
- [ ] ✅ Validación: Mínimo de caracteres
- [ ] ✅ Al cambiar:
  - [ ] Contraseña se actualiza en auth
  - [ ] Toast de éxito
  - [ ] Formulario se limpia
- [ ] ✅ Manejo de errores

#### Estado del Sistema
- [ ] ✅ Card "Estado del Sistema" visible
- [ ] ✅ Indicadores de servicios:
  - [ ] Base de datos
  - [ ] Almacenamiento
  - [ ] Autenticación

---

## 🚫 3. VERIFICACIÓN DE ACCESOS PROHIBIDOS

### NO Debe Poder Acceder a:
- [ ] ❌ Panel de Super Admin
- [ ] ❌ Crear/Editar compañías
- [ ] ❌ Crear otros admins
- [ ] ❌ Ver/Editar datos de otras compañías
- [ ] ❌ Gestionar super admins
- [ ] ❌ Eliminar su propia compañía
- [ ] ❌ Cambiar company_id de empleados
- [ ] ❌ Modificar tablas de otras compañías

### NO Debe Ver:
- [ ] ❌ Empleados de otras compañías
- [ ] ❌ Fichajes de otras compañías
- [ ] ❌ Vacaciones de otras compañías
- [ ] ❌ Nóminas de otras compañías
- [ ] ❌ Opciones de super_admin en menús

---

## 🔧 4. EDGE FUNCTIONS

### create-employee
- [ ] ✅ Solo admin puede ejecutar
- [ ] ✅ Valida company_id del admin
- [ ] ✅ Asigna company_id automáticamente
- [ ] ✅ Crea usuario en auth
- [ ] ✅ Crea perfil
- [ ] ✅ Crea vacation_balance
- [ ] ✅ Crea user_role
- [ ] ✅ Manejo de errores de duplicados
- [ ] ✅ Respuesta success: true/false

### delete-employee
- [ ] ✅ Solo admin puede ejecutar
- [ ] ✅ Valida que empleado pertenece a su compañía
- [ ] ✅ Elimina en orden correcto:
  1. Notifications
  2. Schedule changes
  3. Vacation requests
  4. Vacation balance
  5. Compensatory days
  6. Time entries
  7. Payroll records
  8. User roles
  9. Profile
  10. Auth user
- [ ] ✅ Transaccionalidad (todo o nada)
- [ ] ✅ Respuesta success: true/false
- [ ] ✅ Mensajes de error descriptivos

---

## 🐛 5. ERRORES CONOCIDOS A VERIFICAR

### Errores de Permisos
- [ ] No debe haber "permission denied" en tablas propias
- [ ] No debe haber "RLS policy violation"
- [ ] No debe poder burlar company_id con manipulación

### Errores de Triggers
- [ ] update_vacation_balance funciona correctamente
- [ ] restore_vacation_balance_on_delete funciona
- [ ] calculate_total_hours funciona
- [ ] notify_admin_* funciona
- [ ] notify_employee_* funciona
- [ ] update_time_entry_on_schedule_approval funciona

### Errores de Validación
- [ ] check_vacation_overlap previene solapamientos
- [ ] Validaciones de fechas funcionan
- [ ] Validaciones de duplicados funcionan

---

## 📊 6. INTEGRACIÓN ENTRE MÓDULOS

### Flujo: Vacaciones
1. [ ] Empleado solicita → Notificación a admin
2. [ ] Admin aprueba → Balance se actualiza
3. [ ] Admin aprueba → Notificación a empleado
4. [ ] Admin rechaza → Balance no cambia
5. [ ] Admin elimina aprobada → Balance se restaura

### Flujo: Cambios de Horario
1. [ ] Empleado solicita → Notificación a admin
2. [ ] Admin aprueba → Time entry se crea/actualiza
3. [ ] Admin aprueba → Notificación a empleado
4. [ ] Admin rechaza → Time entry no cambia

### Flujo: Empleados
1. [ ] Admin crea → Auth + Profile + Balance + Roles
2. [ ] Admin elimina → Cascada de eliminaciones
3. [ ] Admin desactiva → Solo marca is_active

---

## ✅ RESUMEN DE CAPACIDADES DEL ADMIN

### PUEDE:
✅ Ver/Gestionar todos los empleados de su compañía
✅ Crear nuevos empleados
✅ Editar información de empleados
✅ Desactivar/Eliminar empleados
✅ Ver/Gestionar fichajes de su compañía
✅ Aprobar/Rechazar solicitudes de vacaciones
✅ Editar/Eliminar solicitudes de vacaciones
✅ Agregar días compensatorios
✅ Aprobar/Rechazar cambios de horario
✅ Crear/Gestionar nóminas
✅ Subir PDFs de nómina
✅ Regularizar fichajes automáticamente
✅ Cambiar su propia contraseña
✅ Recibir notificaciones de solicitudes

### NO PUEDE:
❌ Acceder a datos de otras compañías
❌ Ver/Gestionar panel de super admin
❌ Crear/Editar compañías
❌ Gestionar otros admins o super admins
❌ Modificar estructuras de base de datos
❌ Cambiar configuraciones globales

---

## 📝 NOTAS PARA TESTING

1. **Crear datos de prueba:**
   - Al menos 5 empleados en la compañía
   - Varios fichajes con diferentes estados
   - Solicitudes de vacaciones pendientes/aprobadas/rechazadas
   - Cambios de horario en diferentes estados
   - Algunas nóminas con y sin PDF

2. **Probar límites:**
   - Intentar acceder a IDs de otras compañías
   - Manipular company_id en requests
   - Probar con fechas límite (fin/inicio de mes)
   - Solicitudes de vacaciones solapadas

3. **Verificar seguridad:**
   - RLS policies funcionan correctamente
   - No se pueden burlar permisos
   - Tokens y autenticación válidos
   - Logs de errores no exponen información sensible

---

**FECHA DE PRUEBA:** _________________
**TESTEADO POR:** ____________________
**RESULTADO GENERAL:** [ ] ✅ PASS  [ ] ❌ FAIL
**OBSERVACIONES:** 
_________________________________________________
_________________________________________________
_________________________________________________
