# Video Feedback Product Backlog

## Puntos positivos observados

- La app ya se percibe mas premium y mas cercana a un SaaS.
- El modelo multinicho resulta claro: inmobiliarias, desarrolladores, academias, beauty/spa, rutas/productos, imprentas/B2B, servicios profesionales e industriales.
- La vista de lote inmobiliario con cards, copiar mensaje y abrir WhatsApp manual es util.
- Estado, fallido y proximo paso ayudan a operar.
- Propuestas se entiende como un area comercial valiosa.
- La busqueda por negocio, persona, canal, ciudad, dolor u oportunidad aporta valor real.

## Bugs y fricciones detectadas

- En la vista todos aparecia "Sin nicho" aunque algunos leads eran claramente inmobiliarios.
- Leads sin web o solo Instagram podian sentirse como errores, aunque son trabajables por DM.
- Dominios no funcionales o conflictivos necesitaban un estado visible de revision.
- Al importar un archivo y ver 103 leads, no quedaba claro si fue reemplazo, agregado, batch nuevo o total acumulado.
- Command Center no explicaba suficientemente archivo activo, nicho, batch y cantidad real.
- Seguimiento necesitaba mas estructura para no perder conversaciones.

## Mejoras solicitadas

- Mostrar todos los datos disponibles del contacto: WhatsApp, telefono, Instagram, email, LinkedIn, Facebook, web, reporte_luma, audit_domain, ciudad_zona, fuente_dato y fuente_auditoria.
- Mostrar "No visible" cuando falte un dato.
- Agregar estado "Sin accion por ahora".
- Ampliar canales a WhatsApp, Instagram, email, LinkedIn, web, llamada, manual y sin canal.
- Crear seguimiento con proximo paso, fecha, canal, intentos, estado, ultima nota y mensaje recomendado.
- Agregar acciones rapidas de WhatsApp, llamada, Instagram y copiar mensaje.
- Fortalecer Propuestas con oferta, ticket, estado, proximo paso y nota comercial.
- Separar Revision por motivo.
- Agregar historial de importaciones.
- Hacer Lote de Hoy mas explicito y permitir crearlo desde filtros actuales.
- Documentar backlog de Google Sheets y Luma Intelligence.

## Implementado en esta fase

- Ficha/card completa con datos visibles y fallback elegante "No visible".
- Botones para copiar WhatsApp, abrir WhatsApp manual, abrir Instagram, copiar email, copiar LinkedIn, abrir web y copiar todos los datos.
- Estado `sin_accion_por_ahora` con label "Sin accion por ahora".
- Canales ampliados y prioridad de canal recomendada: WhatsApp, Instagram, email, LinkedIn, llamada, web/manual y sin canal.
- Correccion de nicho pendiente e inferencia inmobiliaria por real_estate, Plusval, inmuebles, propiedades, broker, agente e inmobiliaria.
- Command Center con bloque "Dataset activo".
- Historial de importaciones en localStorage.
- Lote de Hoy con batch, archivo origen, nicho principal, totales y siguiente contacto recomendado.
- Boton "Crear lote de hoy desde filtros actuales".
- Filtros de fecha claros: contactados hoy, seguimiento hoy, seguimiento vencido, seguimiento esta semana, importados recientemente y sin fecha de seguimiento.
- Barra de filtros activos y boton "Limpiar filtros".
- Seguimiento con campos locales de fecha, ultimo canal, intentos, ultima nota, resumen de conversacion, mensaje recomendado y acciones rapidas, incluyendo "Sin accion por ahora".
- Propuestas como area comercial con resumen copiable, links locales de propuesta/material, monto estimado, fecha de propuesta, decision_status y estados enviada, negociando, cerrado y perdido.
- Revision separada por motivo, incluyendo "Solo Instagram" como contacto disponible por DM.
- Badge "Revisar dominio" para web/audit_domain invalido o conflictivo.
- Mensajes seguros: si un mensaje importado inicia con score, afirma perdidas o suena agresivo, se reemplaza por fallback consultivo de revision preliminar.
- Paginacion simple en Prospectos para preparar 500 a 1,000 leads.
- Microinteracciones suaves con hover, transiciones y entrada ligera de cards.

## Backlog priorizado

1. QA en video con Marcos usando importacion real en modo reemplazar y agregar.
2. Ajustar copy y densidad de Seguimiento si hay muchos prospectos en follow-up.
3. Definir reglas finales de merge antes de Google Sheets.
4. Preparar exportacion/importacion bidireccional por nicho.
5. Disenar buscador de Luma Intelligence para 111, 500 o mas auditorias.

## Futuro no implementado

- Google Sheets/Drive sync.
- Automatizacion de WhatsApp o envio de mensajes.
- Deploy.
- Cambios en Luma Intelligence.
- Scanners o procesamiento de datasets originales.
