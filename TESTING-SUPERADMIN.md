# TESTING COMPLETO - ROL SUPER_ADMIN

## 📋 INFORMACIÓN GENERAL
- **Rol:** Super Admin
- **Fecha:** 2025-11-07
- **Company_id:** Debe ser NULL (no pertenece a ninguna compañía)

---

## 🔐 1. VERIFICACIÓN DE POLÍTICAS RLS

### 1.1 Tabla: profiles
- [ ] ✅ Puede ver TODOS los perfiles de TODAS las compañías
- [ ] ✅ Puede crear perfiles en cualquier compañía
- [ ] ✅ Puede editar cualquier perfil
- [ ] ✅ Puede desactivar cualquier empleado
- [ ] ✅ Puede eliminar cualquier empleado
- [ ] ✅ Puede ver otros super_admins
- [ ] ❌ NO debería poder editar otros super_admins (solo crearlos)

### 1.2 Tabla: companies
- [ ] ✅ Puede ver todas las compañías
- [ ] ✅ Puede crear nuevas compañías
- [ ] ✅ Puede editar información de compañías
- [ ] ✅ Puede activar/desactivar compañías
- [ ] ✅ Puede eliminar compañías
- [ ] ✅ Sin restricción de company_id

### 1.3 Tabla: time_entries
- [ ] ✅ Puede ver fichajes de TODAS las compañías
- [ ] ✅ Puede crear fichajes para cualquier empleado
- [ ] ✅ Puede editar fichajes existentes
- [ ] ✅ Puede eliminar fichajes
- [ ] ❌ NO debe haber restricción de company_id

### 1.4 Tabla: vacation_requests
- [ ] ✅ Puede ver solicitudes de TODAS las compañías
- [ ] ✅ Puede aprobar solicitudes de cualquier compañía
- [ ] ✅ Puede rechazar solicitudes de cualquier compañía
- [ ] ✅ Puede eliminar solicitudes de cualquier compañía
- [ ] ✅ Puede editar solicitudes
- [ ] ❌ NO debe haber restricción de company_id

### 1.5 Tabla: vacation_balance
- [ ] ✅ Puede ver balances de TODAS las compañías
- [ ] ✅ Puede editar balances de cualquier empleado
- [ ] ✅ Puede crear balances nuevos
- [ ] ❌ NO debe haber restricción de company_id

### 1.6 Tabla: compensatory_days
- [ ] ✅ Puede ver días compensatorios de TODAS las compañías
- [ ] ✅ Puede crear días para cualquier empleado
- [ ] ✅ Puede eliminar días de cualquier empleado
- [ ] ❌ NO debe haber restricción de company_id

### 1.7 Tabla: schedule_changes
- [ ] ✅ Puede ver solicitudes de TODAS las compañías
- [ ] ✅ Puede aprobar/rechazar solicitudes de cualquier compañía
- [ ] ✅ Puede agregar comentarios de admin
- [ ] ❌ NO debe haber restricción de company_id

### 1.8 Tabla: payroll_records
- [ ] ✅ Puede ver nóminas de TODAS las compañías
- [ ] ✅ Puede crear nóminas para cualquier empleado
- [ ] ✅ Puede subir PDFs de nómina
- [ ] ✅ Puede eliminar nóminas de cualquier compañía
- [ ] ❌ NO debe haber restricción de company_id

### 1.9 Tabla: notifications
- [ ] ✅ Puede ver notificaciones de administración
- [ ] ❌ NO debería ver notificaciones de empleados individuales
- [ ] ✅ Puede marcar notificaciones como leídas

### 1.10 Tabla: user_roles
- [ ] ✅ Puede ver roles de todos los usuarios
- [ ] ✅ La función is_super_admin(auth.uid()) retorna true
- [ ] ✅ La función has_role() funciona correctamente
- [ ] ✅ Puede gestionar roles de usuarios

---

## 🧪 2. PRUEBAS FUNCIONALES POR MÓDULO

### 2.1 AUTENTICACIÓN Y ACCESO

#### Login
- [ ] ✅ Puede iniciar sesión con email y password
- [ ] ✅ Después de login, se redirige al Dashboard
- [ ] ✅ El rol se identifica correctamente como 'super_admin'
- [ ] ✅ El company_id es NULL

#### Permisos de Navegación
- [ ] ✅ Puede acceder a Dashboard
- [ ] ✅ Puede acceder a "Empleados" (todos)
- [ ] ✅ Puede acceder a "Fichajes" (todos)
- [ ] ✅ Puede acceder a "Vacaciones" (todos)
- [ ] ✅ Puede acceder a "Cambios de Horario" (todos)
- [ ] ✅ Puede acceder a "Nóminas" (todos)
- [ ] ✅ Puede acceder a "Regularización" (todos)
- [ ] ✅ Puede acceder a "Panel Super Admin"
- [ ] ✅ Puede acceder a "Ajustes"
- [ ] ✅ Menú muestra opción de "Super Admin Panel"

---

### 2.2 PANEL SUPER ADMIN

#### Vista General
- [ ] ✅ Estadísticas visibles:
  - [ ] Total de empresas
  - [ ] Empresas activas
  - [ ] Empresas inactivas
- [ ] ✅ Porcentajes calculados correctamente
- [ ] ✅ Botones de acción disponibles:
  - [ ] Nuevo Super Admin
  - [ ] Nuevo Admin de Empresa
  - [ ] Nueva Empresa

#### Lista de Empleados por Empresa
- [ ] ✅ Card "Empleados por Empresa" visible
- [ ] ✅ Se muestran todas las empresas activas
- [ ] ✅ Por cada empresa se muestra:
  - [ ] Nombre de empresa
  - [ ] Lista de empleados
  - [ ] Departamentos de empleados
  - [ ] Roles de empleados
- [ ] ✅ Empresas sin empleados se muestran con mensaje apropiado
- [ ] ✅ Loading state funciona

#### Lista de Empresas Registradas
- [ ] ✅ Card "Empresas Registradas" visible
- [ ] ✅ Se muestran TODAS las empresas (activas e inactivas)
- [ ] ✅ Por cada empresa se muestra:
  - [ ] Logo/Icono
  - [ ] Nombre
  - [ ] Badge de estado (Activa/Inactiva)
  - [ ] Email de contacto
  - [ ] Teléfono de contacto
  - [ ] Dirección
  - [ ] Fecha de creación
- [ ] ✅ Dropdown menu por empresa con opciones:
  - [ ] Ver Empleados
  - [ ] Editar Información
  - [ ] Activar/Desactivar Empresa
  - [ ] Eliminar Empresa
- [ ] ✅ Grid layout responsivo (1 col móvil, 2 cols desktop)

---

### 2.3 GESTIÓN DE EMPRESAS

#### Crear Nueva Empresa
- [ ] ✅ Botón "Nueva Empresa" visible
- [ ] ✅ Dialog se abre correctamente
- [ ] ✅ Campos del formulario:
  - [ ] Nombre de la Empresa (requerido)
  - [ ] Email de Contacto
  - [ ] Teléfono de Contacto
  - [ ] Dirección
  - [ ] URL del Logo
- [ ] ✅ Validación: Nombre es requerido
- [ ] ✅ Al crear empresa:
  - [ ] Se crea registro en tabla companies
  - [ ] is_active = true por defecto
  - [ ] created_at se registra automáticamente
- [ ] ✅ Toast de éxito al crear
- [ ] ✅ Lista de empresas se actualiza automáticamente
- [ ] ✅ Dialog se cierra después de crear

#### Editar Empresa
- [ ] ✅ Opción "Editar Información" en menú
- [ ] ✅ Puede modificar:
  - [ ] Nombre
  - [ ] Email de contacto
  - [ ] Teléfono
  - [ ] Dirección
  - [ ] Logo URL
- [ ] ✅ Cambios se guardan correctamente
- [ ] ✅ Toast de éxito
- [ ] ✅ Vista se actualiza

#### Activar/Desactivar Empresa
- [ ] ✅ Opción visible en menú
- [ ] ✅ Texto cambia según estado actual
- [ ] ✅ Al desactivar:
  - [ ] is_active cambia a false
  - [ ] Badge cambia a "Inactiva"
  - [ ] Empleados de esa empresa no pueden hacer login (verificar)
  - [ ] Toast de confirmación
- [ ] ✅ Al activar:
  - [ ] is_active cambia a true
  - [ ] Badge cambia a "Activa"
  - [ ] Empleados pueden volver a hacer login
  - [ ] Toast de confirmación

#### Eliminar Empresa
- [ ] ✅ Opción "Eliminar Empresa" en menú
- [ ] ✅ Texto en rojo/destructive
- [ ] ✅ Confirmación antes de eliminar
- [ ] ✅ Mensaje de advertencia claro
- [ ] ✅ Al eliminar (debe ser cascada):
  - [ ] Se eliminan todos los empleados de la empresa
  - [ ] Se eliminan fichajes (time_entries)
  - [ ] Se eliminan solicitudes de vacaciones
  - [ ] Se eliminan balances de vacaciones
  - [ ] Se eliminan días compensatorios
  - [ ] Se eliminan cambios de horario
  - [ ] Se eliminan nóminas
  - [ ] Se eliminan notificaciones
  - [ ] Se elimina el registro de la empresa
- [ ] ✅ Toast de confirmación
- [ ] ✅ Lista se actualiza

---

### 2.4 GESTIÓN DE SUPER ADMINS

#### Crear Nuevo Super Admin
- [ ] ✅ Botón "Nuevo Super Admin" visible
- [ ] ✅ Dialog se abre correctamente
- [ ] ✅ Campos del formulario:
  - [ ] Nombre Completo (requerido)
  - [ ] Email (requerido)
  - [ ] Contraseña Temporal (requerido, mín 6 caracteres)
- [ ] ✅ Botón mostrar/ocultar contraseña funciona
- [ ] ✅ Validación: Email válido
- [ ] ✅ Validación: Contraseña mínimo 6 caracteres
- [ ] ✅ Al crear:
  - [ ] Llama a edge function create-employee
  - [ ] Se crea usuario en auth.users
  - [ ] Se crea perfil en profiles con role='super_admin'
  - [ ] company_id es NULL
  - [ ] Se crea user_role con 'super_admin'
  - [ ] Email auto-confirmado (email_confirm: true)
  - [ ] ❌ NO se crea vacation_balance (super admin no necesita)
- [ ] ✅ Validación: Email duplicado muestra error
- [ ] ✅ Toast de éxito con nombre del super admin
- [ ] ✅ Dialog se cierra
- [ ] ✅ Formulario se limpia

#### Verificación Post-Creación
- [ ] ✅ Nuevo super admin puede hacer login inmediatamente
- [ ] ✅ Tiene acceso a panel super admin
- [ ] ✅ Tiene permisos completos
- [ ] ✅ No aparece en lista de empleados de ninguna compañía

---

### 2.5 GESTIÓN DE ADMINS DE EMPRESA

#### Crear Nuevo Admin de Empresa
- [ ] ✅ Botón "Nuevo Admin de Empresa" visible
- [ ] ✅ Dialog se abre correctamente
- [ ] ✅ Campos del formulario:
  - [ ] Empresa (selector, requerido)
  - [ ] Nombre Completo (requerido)
  - [ ] Email (requerido)
  - [ ] Contraseña Temporal (requerido, mín 6 caracteres)
- [ ] ✅ Selector de empresa:
  - [ ] Solo muestra empresas activas
  - [ ] Muestra nombre de empresa
  - [ ] Placeholder apropiado
- [ ] ✅ Botón mostrar/ocultar contraseña funciona
- [ ] ✅ Validaciones funcionan
- [ ] ✅ Al crear:
  - [ ] Llama a edge function create-employee
  - [ ] Se crea usuario en auth.users
  - [ ] Se crea perfil con role='admin'
  - [ ] company_id = empresa seleccionada
  - [ ] Se crea user_role con 'admin'
  - [ ] Email auto-confirmado
  - [ ] Se crea vacation_balance (22 días)
- [ ] ✅ Toast de éxito con nombre y empresa
- [ ] ✅ Dialog se cierra
- [ ] ✅ Formulario se limpia

#### Verificación Post-Creación
- [ ] ✅ Nuevo admin puede hacer login
- [ ] ✅ Solo ve empleados de su compañía
- [ ] ✅ No tiene acceso a panel super admin
- [ ] ✅ Aparece en lista de empleados de su compañía

---

### 2.6 GESTIÓN DE EMPLEADOS (Global)

#### Ver Empleados de Todas las Compañías
- [ ] ✅ Puede acceder a página "Empleados"
- [ ] ✅ Se muestran empleados de TODAS las compañías
- [ ] ❌ NO hay filtro por company_id
- [ ] ✅ Búsqueda funciona en todos los empleados
- [ ] ✅ Por cada empleado se muestra:
  - [ ] Nombre completo
  - [ ] Email
  - [ ] Rol
  - [ ] Departamento
  - [ ] Empresa (company_id)
  - [ ] Estado (activo/inactivo)

#### Crear Empleados en Cualquier Compañía
- [ ] ✅ Botón "Crear Empleado" disponible
- [ ] ✅ Puede seleccionar empresa de destino
- [ ] ✅ Puede crear empleado en cualquier compañía
- [ ] ✅ company_id se asigna correctamente

#### Editar Empleados de Cualquier Compañía
- [ ] ✅ Puede editar empleados de cualquier compañía
- [ ] ✅ Puede cambiar company_id (mover entre empresas)
- [ ] ✅ Puede cambiar rol
- [ ] ✅ Puede cambiar todos los campos

#### Eliminar Empleados de Cualquier Compañía
- [ ] ✅ Puede eliminar empleados de cualquier compañía
- [ ] ✅ Edge function delete-employee funciona sin restricción
- [ ] ✅ Cascada de eliminación funciona

---

### 2.7 GESTIÓN DE FICHAJES (Global)

#### Ver Fichajes de Todas las Compañías
- [ ] ✅ Página "Fichajes" accesible
- [ ] ✅ Lista muestra empleados de TODAS las compañías
- [ ] ✅ Al seleccionar empleado, muestra sus fichajes
- [ ] ✅ No hay restricción por company_id

#### Gestionar Fichajes
- [ ] ✅ Puede ver fichajes de cualquier empleado
- [ ] ✅ Puede editar fichajes
- [ ] ✅ Puede crear fichajes manualmente
- [ ] ✅ Puede eliminar fichajes

---

### 2.8 GESTIÓN DE VACACIONES (Global)

#### Ver Solicitudes de Todas las Compañías
- [ ] ✅ Página "Vacaciones" accesible
- [ ] ✅ Se muestran empleados de TODAS las compañías
- [ ] ✅ Se muestran solicitudes de todas las compañías
- [ ] ✅ No hay filtro por company_id

#### Aprobar/Rechazar Solicitudes
- [ ] ✅ Puede aprobar solicitudes de cualquier compañía
- [ ] ✅ Puede rechazar solicitudes de cualquier compañía
- [ ] ✅ Balance se actualiza correctamente
- [ ] ✅ Notificaciones se envían al empleado

#### Editar/Eliminar Solicitudes
- [ ] ✅ Puede editar solicitudes de cualquier compañía
- [ ] ✅ Puede eliminar solicitudes de cualquier compañía
- [ ] ✅ Balance se ajusta correctamente

#### Agregar Días Compensatorios
- [ ] ✅ Puede agregar días a empleados de cualquier compañía
- [ ] ✅ granted_by = super_admin id
- [ ] ✅ company_id correcto

---

### 2.9 GESTIÓN DE CAMBIOS DE HORARIO (Global)

#### Ver Solicitudes de Todas las Compañías
- [ ] ✅ Página "Cambios de Horario" accesible
- [ ] ✅ Se muestran solicitudes de TODAS las compañías
- [ ] ✅ No hay restricción por company_id

#### Aprobar/Rechazar Cambios
- [ ] ✅ Puede aprobar cambios de cualquier compañía
- [ ] ✅ Puede rechazar cambios de cualquier compañía
- [ ] ✅ Time entries se actualizan correctamente
- [ ] ✅ Notificaciones se envían

---

### 2.10 GESTIÓN DE NÓMINAS (Global)

#### Ver Nóminas de Todas las Compañías
- [ ] ✅ Página "Nóminas" accesible
- [ ] ✅ Se muestran empleados de TODAS las compañías
- [ ] ✅ Se muestran nóminas de todas las compañías

#### Crear/Gestionar Nóminas
- [ ] ✅ Puede crear nóminas para empleados de cualquier compañía
- [ ] ✅ Puede subir PDFs
- [ ] ✅ Puede eliminar nóminas de cualquier compañía

---

### 2.11 REGULARIZACIÓN (Global)

#### Regularizar Fichajes
- [ ] ✅ Puede seleccionar empleados de TODAS las compañías
- [ ] ✅ Proceso de regularización funciona
- [ ] ✅ company_id se asigna correctamente en nuevos fichajes

---

### 2.12 AJUSTES (Super Admin)

#### Información de Perfil
- [ ] ✅ Muestra nombre completo del super admin
- [ ] ✅ Muestra email
- [ ] ✅ Muestra rol: super_admin
- [ ] ✅ NO muestra departamento
- [ ] ✅ NO muestra empresa

#### Cambiar Contraseña
- [ ] ✅ Formulario visible y funcional
- [ ] ✅ Validaciones funcionan
- [ ] ✅ Contraseña se actualiza en auth

---

## 🚫 3. VERIFICACIÓN DE ACCESOS PROHIBIDOS

### NO Debe Poder:
- [ ] ❌ Verse restringido por company_id en ninguna tabla
- [ ] ❌ Tener limitaciones de visualización de datos
- [ ] ❌ Estar bloqueado para crear/editar/eliminar datos

### Debe Tener Acceso Total a:
- [ ] ✅ Todos los datos de todas las compañías
- [ ] ✅ Todas las funcionalidades de admin
- [ ] ✅ Gestión de compañías
- [ ] ✅ Creación de super admins
- [ ] ✅ Creación de admins de empresa

---

## 🔧 4. EDGE FUNCTIONS

### create-employee
- [ ] ✅ Super admin puede ejecutar
- [ ] ✅ Puede crear empleados con role='employee'
- [ ] ✅ Puede crear empleados con role='admin'
- [ ] ✅ Puede crear empleados con role='super_admin'
- [ ] ✅ Validación de autorización funciona
- [ ] ✅ Para super_admin: company_id = NULL
- [ ] ✅ Para admin/employee: company_id requerido
- [ ] ✅ Email auto-confirmado (email_confirm: true)
- [ ] ✅ Trigger handle_new_user funciona correctamente
- [ ] ✅ Respuesta success: true/false

### delete-employee
- [ ] ✅ Super admin puede ejecutar
- [ ] ✅ Puede eliminar empleados de cualquier compañía
- [ ] ✅ Puede eliminar admins de cualquier compañía
- [ ] ✅ Cascada de eliminación completa:
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
- [ ] ✅ Respuesta success: true/false

---

## 🔄 5. INTEGRACIÓN ENTRE MÓDULOS

### Flujo: Crear Empresa → Admin → Empleado
1. [ ] Super admin crea empresa
2. [ ] Super admin crea admin para esa empresa
3. [ ] Admin puede hacer login y ver su empresa
4. [ ] Admin crea empleado
5. [ ] Empleado tiene vacation_balance
6. [ ] Todos los company_id son correctos

### Flujo: Desactivar Empresa
1. [ ] Super admin desactiva empresa
2. [ ] Empleados de esa empresa no pueden hacer login (verificar)
3. [ ] Datos siguen existiendo
4. [ ] Super admin sigue viendo los datos
5. [ ] Admin de esa empresa no puede hacer login (verificar)

### Flujo: Eliminar Empresa
1. [ ] Super admin elimina empresa
2. [ ] Todos los datos relacionados se eliminan
3. [ ] Empleados ya no existen en auth
4. [ ] Admin ya no existe
5. [ ] No quedan registros huérfanos

### Flujo: Crear Super Admin
1. [ ] Super admin crea otro super admin
2. [ ] Nuevo super admin puede hacer login
3. [ ] Tiene mismo nivel de permisos
4. [ ] NO tiene company_id
5. [ ] NO tiene vacation_balance

---

## 🔍 6. VERIFICACIONES DE SEGURIDAD

### Políticas RLS - Super Admin Bypass
- [ ] ✅ Función is_super_admin(auth.uid()) retorna true
- [ ] ✅ Todas las políticas tienen cláusula OR is_super_admin()
- [ ] ✅ Super admin puede leer todas las tablas
- [ ] ✅ Super admin puede modificar todas las tablas
- [ ] ✅ No hay restricción de company_id para super admin

### Funciones de Base de Datos
- [ ] ✅ has_role() funciona con 'super_admin'
- [ ] ✅ is_super_admin() funciona correctamente
- [ ] ✅ get_user_company_id() retorna NULL para super admin
- [ ] ✅ Triggers no interfieren con operaciones de super admin

### Triggers y Validaciones
- [ ] ✅ handle_new_user funciona para super_admin
- [ ] ✅ update_vacation_balance NO aplica a super admins
- [ ] ✅ check_vacation_overlap permite operaciones de super admin
- [ ] ✅ Notificaciones NO se envían al crear/modificar como super admin

---

## 📊 7. DASHBOARD Y ESTADÍSTICAS

### Dashboard Principal
- [ ] ✅ Muestra estadísticas globales:
  - [ ] Total de empresas
  - [ ] Total de empleados (todas las compañías)
  - [ ] Solicitudes pendientes (todas las compañías)
- [ ] ✅ Indicadores correctos
- [ ] ✅ Accesos rápidos funcionan

### Panel Super Admin
- [ ] ✅ Estadísticas de empresas precisas
- [ ] ✅ Porcentajes calculados correctamente
- [ ] ✅ Empleados por empresa correctos
- [ ] ✅ Totales coinciden con la realidad

---

## 🐛 8. ERRORES CONOCIDOS A VERIFICAR

### Errores de Permisos
- [ ] No debe haber "permission denied" para super admin
- [ ] No debe haber "RLS policy violation"
- [ ] No debe haber restricciones de company_id

### Errores de Integridad
- [ ] Super admin NO debe tener company_id
- [ ] Super admin NO debe tener vacation_balance
- [ ] Cascadas de eliminación funcionan correctamente
- [ ] No quedan registros huérfanos al eliminar empresa

### Errores de Autenticación
- [ ] Super admin puede crear usuarios sin problemas
- [ ] Email auto-confirmado funciona (email_confirm: true)
- [ ] Nuevos usuarios pueden hacer login inmediatamente
- [ ] Roles se asignan correctamente

---

## 📝 9. CASOS DE PRUEBA ESPECÍFICOS

### Caso 1: Crear Sistema Completo
- [ ] Crear empresa A
- [ ] Crear admin para empresa A
- [ ] Admin de A crea 3 empleados
- [ ] Crear empresa B
- [ ] Crear admin para empresa B
- [ ] Admin de B crea 2 empleados
- [ ] Super admin ve TODOS (5 empleados + 2 admins)
- [ ] Admin A solo ve sus 3 empleados
- [ ] Admin B solo ve sus 2 empleados

### Caso 2: Mover Empleado entre Empresas
- [ ] Super admin selecciona empleado de empresa A
- [ ] Edita y cambia company_id a empresa B
- [ ] Empleado ahora pertenece a empresa B
- [ ] Admin A ya no lo ve
- [ ] Admin B ahora lo ve
- [ ] vacation_balance se mantiene o se recrea

### Caso 3: Eliminar Empresa con Datos
- [ ] Empresa tiene 5 empleados
- [ ] Empleados tienen fichajes, vacaciones, nóminas
- [ ] Super admin elimina empresa
- [ ] Todos los datos se eliminan en cascada
- [ ] Sin errores de foreign key
- [ ] Confirmación correcta

### Caso 4: Crear Otro Super Admin
- [ ] Super admin A crea super admin B
- [ ] Super admin B puede hacer login
- [ ] Ambos tienen mismo nivel de permisos
- [ ] Ambos ven los mismos datos
- [ ] Ambos pueden crear empresas/admins/empleados

### Caso 5: Desactivar Empresa
- [ ] Super admin desactiva empresa X
- [ ] Empleados de X no pueden hacer login
- [ ] Admin de X no puede hacer login
- [ ] Super admin sigue viendo datos de X
- [ ] Al reactivar, todos vuelven a tener acceso

---

## ✅ RESUMEN DE CAPACIDADES DEL SUPER_ADMIN

### PUEDE (Acceso Total):
✅ Ver TODOS los datos de TODAS las compañías
✅ Crear/Editar/Eliminar compañías
✅ Activar/Desactivar compañías
✅ Crear otros super admins
✅ Crear admins de empresa
✅ Crear/Editar/Eliminar empleados de cualquier compañía
✅ Ver/Gestionar fichajes de todos
✅ Ver/Gestionar vacaciones de todos
✅ Ver/Gestionar cambios de horario de todos
✅ Ver/Gestionar nóminas de todos
✅ Regularizar fichajes de cualquier empleado
✅ Sin restricción de company_id en ninguna tabla
✅ Ejecutar todas las edge functions sin restricciones

### NO TIENE:
❌ company_id (es NULL)
❌ vacation_balance (no lo necesita)
❌ Restricciones de visualización de datos
❌ Limitaciones por empresa

---

## 🎯 CHECKLIST DE VERIFICACIÓN RÁPIDA

### Acceso a Datos ✓
- [ ] Ver todas las empresas
- [ ] Ver todos los empleados
- [ ] Ver todos los fichajes
- [ ] Ver todas las vacaciones
- [ ] Ver todos los cambios de horario
- [ ] Ver todas las nóminas

### Gestión de Empresas ✓
- [ ] Crear empresa
- [ ] Editar empresa
- [ ] Activar/Desactivar empresa
- [ ] Eliminar empresa

### Gestión de Usuarios ✓
- [ ] Crear super admin
- [ ] Crear admin de empresa
- [ ] Crear empleados
- [ ] Editar usuarios
- [ ] Eliminar usuarios

### Funcionalidades Admin ✓
- [ ] Aprobar vacaciones
- [ ] Rechazar vacaciones
- [ ] Aprobar cambios de horario
- [ ] Crear nóminas
- [ ] Regularizar fichajes

---

## 📌 NOTAS IMPORTANTES PARA TESTING

1. **Super Admin NO tiene company_id:**
   - Verificar que el campo company_id sea NULL
   - Verificar que no se filtre por company_id en consultas

2. **Acceso Global:**
   - Probar con múltiples empresas creadas
   - Verificar que ve datos de TODAS

3. **Creación de Usuarios:**
   - Probar crear empleado, admin y super_admin
   - Verificar que company_id se asigna correctamente según rol

4. **Eliminación en Cascada:**
   - Crear datos completos antes de eliminar empresa
   - Verificar que no queden registros huérfanos

5. **RLS Policies:**
   - Verificar que todas incluyen: OR is_super_admin(auth.uid())
   - No debe haber "permission denied" para super admin

6. **Edge Functions:**
   - Verificar autorización por rol 'super_admin'
   - Verificar que company_id se maneja correctamente

---

**FECHA DE PRUEBA:** _________________
**TESTEADO POR:** ____________________
**RESULTADO GENERAL:** [ ] ✅ PASS  [ ] ❌ FAIL
**OBSERVACIONES:** 
_________________________________________________
_________________________________________________
_________________________________________________
