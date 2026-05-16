## ❌ Historias de Usuario No Realizadas / Parciales

| ID | Historia de Usuario | Estado | Observaciones Técnicas |
|---|---|---|---|
| HU-03 | Registro de Notas | ⚠️ Parcial | Valida rango (0-5) y período. Pendiente: validar que el docente sea el titular de la asignatura específica. |
| HU-04 | Modificación de Notas | ⚠️ Parcial | Registra auditoría (valorAnterior, actualizadoPor) y notifica. Pendiente: validación de titularidad. |
| HU-09 | Pago de Multas | ⚠️ Parcial | Simula pasarela (Sandbox). Pendiente: lógica de reintento automático para pagos PENDIENTES. |
| HU-12 | Cancelación de Reserva | ⚠️ Parcial | Valida anticipación de 1 hora. Pendiente: notificación por correo de la cancelación. |
| HU-14 | Historial de Préstamos | ⚠️ Parcial | El servicio existe, pero falta implementar los filtros por estudiante y período en el endpoint. |
| HU-16 | Reportes (Admin) | ❌ No | No se encontró lógica de generación de reportes ni exportación a PDF/Excel. |

---

## ✅ Historias de Usuario Realizadas

| ID | Historia de Usuario | Estado | Observaciones Técnicas |
|---|---|---|---|
| HU-01 | Autenticación y Roles | ✅ Cumple | Implementado con JWT (30m), RateLimitGuard (5 intentos/30min) y protección de rutas por roles. |
| HU-02 | Registro de Usuarios (Admin) | ✅ Cumple | Valida correo único, asigna roles y envía correo de bienvenida vía NotificationsService. |
| HU-05 | Consulta de Notas (Estudiante) | ✅ Cumple | Filtrado por estudiante y período implementado en GradesService. |
| HU-06 | Catálogo de Libros (Público) | ✅ Cumple | Búsqueda por filtros disponible sin autenticación en BooksController. |
| HU-07 | Préstamo de Libros | ✅ Cumple | Bloquea por multas, decrementa stock automáticamente y notifica por correo. |
| HU-08 | Devolución y Multas | ✅ Cumple | Cálculo automático ($1000/día), genera multa en DB y notifica al estudiante. |
| HU-10 | Reserva de Sala (Estudiante) | ✅ Cumple | Valida 7 días de anticipación, solapamiento de horarios y envía confirmación. |
| HU-11 | Reserva de Sala (Docente) | ✅ Cumple | Utiliza la misma lógica de reserva que el estudiante. |
| HU-13 | Gestión de Catálogo (Libros) | ✅ Cumple | CRUD completo; impide baja si hay préstamos activos. |
| HU-15 | Consulta de Multas | ✅ Cumple | Implementado en findPendingFinesByUser con detalle de libro y monto. |
| HU-17 | Notificación Preventiva | ✅ Cumple | CronJob diario configurado para avisar sobre préstamos por vencer. |
| HU-18 | Gestión de Cuentas | ✅ Cumple | Permite cambiar estados (ACTIVO, BLOQUEADO e INACTIVO) y registrar auditoría. |