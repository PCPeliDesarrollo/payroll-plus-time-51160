# ✅ CHECKLIST DE TESTING - ROL EMPLEADO

## 📋 RESUMEN DE FUNCIONALIDADES DISPONIBLES

### ✓ Páginas accesibles para empleados:
1. **Dashboard** - `/` (vista empleado)
2. **Mis Fichajes** - Fichajes personales
3. **Mis Vacaciones** - Gestión de vacaciones
4. **Cambios de Horario** - Solicitudes de cambio
5. **Mis Nóminas** - Ver nóminas personales
6. **Mi Perfil** - Datos personales

---

## 🔐 POLÍTICAS RLS - VERIFICACIÓN POR TABLA

### ✅ **profiles**
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Puede ver su propio perfil | ⬜ | `auth.uid() = id` |
| UPDATE | NO puede actualizar | ⬜ | Solo admin/super_admin |
| INSERT | NO puede insertar | ⬜ | Solo sistema |
| DELETE | NO puede eliminar | ⬜ | Solo admin/super_admin |

### ✅ **time_entries** (Fichajes)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propios fichajes | ⬜ | `auth.uid() = user_id` |
| INSERT | Puede crear fichajes propios | ⬜ | `auth.uid() = user_id AND company_id correcto` |
| UPDATE | Puede actualizar sus fichajes | ⬜ | `auth.uid() = user_id` |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **vacation_requests** (Solicitudes de Vacaciones)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propias solicitudes | ⬜ | `auth.uid() = user_id` |
| INSERT | Puede crear solicitudes | ⬜ | `auth.uid() = user_id AND company_id correcto` |
| UPDATE | Solo si está en estado 'pending' | ⬜ | `auth.uid() = user_id AND status = 'pending'` |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **vacation_balance** (Balance de Vacaciones)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo su propio balance | ⬜ | `auth.uid() = user_id` |
| UPDATE | NO puede actualizar | ⬜ | Solo admin/sistema |
| INSERT | NO puede insertar | ⬜ | Solo admin/sistema |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **schedule_changes** (Cambios de Horario)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propias solicitudes | ⬜ | `auth.uid() = user_id` |
| INSERT | Puede crear solicitudes | ⬜ | `auth.uid() = user_id AND company_id correcto` |
| UPDATE | Solo si está en estado 'pending' | ⬜ | `auth.uid() = user_id AND status = 'pending'` |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **compensatory_days** (Días Compensatorios)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propios días | ⬜ | `auth.uid() = user_id` |
| UPDATE | NO puede actualizar | ⬜ | Solo admin |
| INSERT | NO puede insertar | ⬜ | Solo admin |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **payroll_records** (Nóminas)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propias nóminas | ⬜ | `auth.uid() = user_id` |
| UPDATE | NO puede actualizar | ⬜ | Solo admin |
| INSERT | NO puede insertar | ⬜ | Solo admin |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

### ✅ **notifications** (Notificaciones)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propias notificaciones | ⬜ | `auth.uid() = user_id` |
| UPDATE | Puede marcar como leídas | ⬜ | `auth.uid() = user_id` |
| INSERT | NO puede insertar | ⬜ | Solo sistema |
| DELETE | NO puede eliminar | ⬜ | Nadie puede eliminar |

### ✅ **companies** (Empresas)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo su empresa | ⬜ | `id = get_user_company_id(auth.uid())` |
| UPDATE | NO puede actualizar | ⬜ | Solo super_admin |
| INSERT | NO puede insertar | ⬜ | Solo super_admin |
| DELETE | NO puede eliminar | ⬜ | Solo super_admin |

### ✅ **user_roles** (Roles de Usuario)
| Acción | Política | ¿Funciona? | Notas |
|--------|----------|------------|-------|
| SELECT | Solo sus propios roles | ⬜ | `user_id = auth.uid()` |
| UPDATE | NO puede actualizar | ⬜ | Solo admin |
| INSERT | NO puede insertar | ⬜ | Solo admin |
| DELETE | NO puede eliminar | ⬜ | Solo admin |

---

## 🧪 CASOS DE PRUEBA - FUNCIONALIDADES

### 1. ✅ **AUTENTICACIÓN**
- [ ] Login con credenciales de empleado
- [ ] Logout correcto
- [ ] Sesión persiste después de recargar
- [ ] No puede acceder a rutas de admin

### 2. ✅ **DASHBOARD (Vista Empleado)**
- [ ] Se muestra el dashboard de empleado (no el de admin)
- [ ] Estadísticas personales correctas:
  - [ ] Horas trabajadas este mes
  - [ ] Días trabajados
  - [ ] Vacaciones restantes
  - [ ] Último fichaje
- [ ] Tarjeta de fichaje rápido funciona
- [ ] Historial de fichajes de la semana se muestra
- [ ] Tarjeta de solicitud de cambio de horario funciona

### 3. ✅ **MIS FICHAJES**
#### Check-In / Check-Out
- [ ] Puede hacer check-in (entrada)
- [ ] Se guarda la ubicación GPS
- [ ] Reloj en tiempo real funciona
- [ ] Estado cambia a "Fichado"
- [ ] Puede hacer check-out (salida)
- [ ] Se calcula correctamente el total de horas
- [ ] NO puede fichar dos veces el mismo día sin salida

#### Historial
- [ ] Ve solo sus propios fichajes
- [ ] Calendario muestra días con fichajes
- [ ] Al seleccionar fecha, muestra detalles correctos
- [ ] Fichajes agrupados por mes
- [ ] Puede solicitar cambio de horario desde el menú
- [ ] NO puede ver fichajes de otros empleados

### 4. ✅ **MIS VACACIONES**
#### Balance de Vacaciones
- [ ] Muestra días totales correctos
- [ ] Muestra días usados correctos
- [ ] Muestra días disponibles correctos
- [ ] El cálculo es correcto (total - usados = disponibles)

#### Calendario de Vacaciones
- [ ] Muestra calendario del mes actual
- [ ] Días pendientes en amarillo
- [ ] Días aprobados en verde
- [ ] Días rechazados en rojo
- [ ] Puede navegar entre meses

#### Crear Solicitud
- [ ] Puede abrir diálogo de nueva solicitud
- [ ] Selecciona fecha inicio y fin
- [ ] Valida que fecha fin > fecha inicio
- [ ] Valida solapamiento con solicitudes existentes
- [ ] Calcula automáticamente días hábiles
- [ ] Se crea la solicitud correctamente
- [ ] Aparece notificación de éxito

#### Gestionar Solicitudes
- [ ] Ve todas sus solicitudes
- [ ] Solicitudes agrupadas por mes
- [ ] Estados correctos (Pendiente/Aprobada/Rechazada)
- [ ] Puede EDITAR solicitudes pendientes
- [ ] Puede ELIMINAR solicitudes pendientes
- [ ] NO puede editar solicitudes aprobadas
- [ ] NO puede eliminar solicitudes aprobadas
- [ ] NO puede ver solicitudes de otros empleados

### 5. ✅ **CAMBIOS DE HORARIO**
#### Solicitar Cambio
- [ ] Puede abrir diálogo de solicitud
- [ ] Selecciona fecha del cambio
- [ ] Muestra horario actual (si existe fichaje)
- [ ] Puede establecer nuevo check-in
- [ ] Puede establecer nuevo check-out
- [ ] Puede añadir motivo
- [ ] Se crea la solicitud correctamente

#### Gestionar Solicitudes
- [ ] Ve todas sus solicitudes de cambio
- [ ] Estados correctos (Pendiente/Aprobada/Rechazada)
- [ ] Puede EDITAR solicitudes pendientes
- [ ] NO puede editar solicitudes aprobadas
- [ ] NO puede ver solicitudes de otros empleados

### 6. ✅ **MIS NÓMINAS**
- [ ] Ve solo sus propias nóminas
- [ ] Muestra información completa:
  - [ ] Mes y año
  - [ ] Salario base
  - [ ] Horas extra (si aplica)
  - [ ] Deducciones
  - [ ] Bonos
  - [ ] Salario neto
- [ ] Puede descargar PDF si está disponible
- [ ] NO puede ver nóminas de otros empleados
- [ ] NO puede editar nóminas

### 7. ✅ **MI PERFIL**
- [ ] Ve su información personal
- [ ] Datos correctos:
  - [ ] Nombre completo
  - [ ] Email
  - [ ] Teléfono
  - [ ] Departamento
  - [ ] ID de empleado
  - [ ] Fecha de contratación
- [ ] NO puede editar información (solo admin)

### 8. ✅ **NOTIFICACIONES**
- [ ] Recibe notificaciones cuando:
  - [ ] Una solicitud de vacaciones es aprobada
  - [ ] Una solicitud de vacaciones es rechazada
  - [ ] Una solicitud de cambio es aprobada
  - [ ] Una solicitud de cambio es rechazada
- [ ] Puede marcar notificaciones como leídas
- [ ] Contador de notificaciones no leídas

---

## ⚠️ SEGURIDAD - VERIFICACIÓN DE ACCESOS PROHIBIDOS

### ❌ **EL EMPLEADO NO DEBE PODER:**
- [ ] Ver lista de todos los empleados
- [ ] Ver datos de otros empleados
- [ ] Crear/editar/eliminar otros empleados
- [ ] Ver fichajes de otros empleados
- [ ] Editar fichajes pasados (solo solicitar cambio)
- [ ] Aprobar/rechazar solicitudes de vacaciones
- [ ] Aprobar/rechazar cambios de horario
- [ ] Ver/editar nóminas de otros empleados
- [ ] Crear nóminas
- [ ] Gestionar días compensatorios
- [ ] Acceder al panel de administración
- [ ] Ver panel de regularización
- [ ] Exportar datos de todos los empleados
- [ ] Gestionar configuración de la empresa

---

## 🐛 ERRORES CONOCIDOS A VERIFICAR

### 1. Company_id
- [ ] Al crear fichajes, se asigna company_id correcto
- [ ] Al crear solicitudes de vacaciones, se asigna company_id correcto
- [ ] Al crear solicitudes de cambio, se asigna company_id correcto

### 2. Validaciones
- [ ] No puede fichar si ya está fichado
- [ ] No puede solicitar vacaciones sin saldo
- [ ] No puede solicitar vacaciones solapadas
- [ ] Fechas inválidas muestran error claro

### 3. UI/UX
- [ ] Todos los botones funcionan
- [ ] Carga de datos no bloquea la interfaz
- [ ] Mensajes de error son claros
- [ ] Responsive funciona en móvil
- [ ] No hay información de otros empleados visible

---

## 📊 RESULTADO FINAL

**Total de verificaciones:** 100+

**Estado:**
- ✅ Aprobadas: ____ / ____
- ❌ Fallidas: ____ / ____
- ⚠️ Pendientes: ____ / ____

**Conclusión:**
_[Espacio para notas del tester]_

---

## 🔍 INSTRUCCIONES PARA TESTEAR

1. **Crear usuario de prueba empleado:**
   - Email: test-employee@empresa.com
   - Password: test123
   - Rol: employee
   - Company: [Asignar a empresa existente]

2. **Login con el usuario empleado**

3. **Seguir cada sección del checklist marcando:**
   - ✅ Si funciona correctamente
   - ❌ Si falla (anotar el error)
   - ⚠️ Si hay comportamiento inesperado

4. **Reportar todos los errores encontrados**

5. **Intentar hacer acciones prohibidas para verificar seguridad**

---

## 📝 NOTAS ADICIONALES

- Todas las políticas RLS están configuradas para aislar datos por `auth.uid()`
- El `company_id` se obtiene mediante la función `get_user_company_id(auth.uid())`
- Los empleados solo pueden crear registros con su propio `user_id`
- Las actualizaciones están limitadas a registros propios y estados específicos
- Las eliminaciones están restringidas solo a administradores

**Fecha de creación:** 2025-11-07
**Última actualización:** 2025-11-07
