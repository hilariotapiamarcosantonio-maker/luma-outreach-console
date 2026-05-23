# Lead Card Identity-First UX

## Objetivo

`LeadOperationalCard` debe funcionar como una tarjeta de venta para Marcos, no como una ficha tecnica. La primera lectura debe responder:

- A quien le va a escribir.
- Que rol/oficina tiene esa persona o negocio.
- En que estado comercial esta.
- Cual es el canal recomendado.
- Que oferta y ticket conviene empujar.
- Que mensaje debe copiar antes de abrir WhatsApp.

## Jerarquia aplicada

1. Identidad primero: nombre del negocio/contacto, persona visible cuando no duplica el nombre, cargo/rol, oficina/marca y ciudad/zona.
2. Subheader comercial: estado actual, prioridad, canal recomendado, oferta Luma y ticket sugerido.
3. Siguiente accion: caja compacta con proximo paso y fecha de seguimiento.
4. Acciones manuales: copiar mensaje, abrir WhatsApp, marcar avance, guardar en Sheets y abrir detalles.
5. Mensaje recomendado: preview corto visible, con copiar y ver mensaje completo.
6. Datos secundarios: Instagram, email, web, origen, reporte Luma, notas, senal comercial y dolor probable quedan dentro de `Ver datos`.

## Mobile

En movil la lectura queda ordenada para operacion rapida:

1. Nombre e identidad.
2. Estado comercial.
3. WhatsApp visible.
4. Copiar mensaje.
5. Abrir WhatsApp.
6. Guardar en Sheets.

Los botones de avance siguen disponibles, pero `Guardar en Sheets` sube antes que ellos en el orden movil para proteger el flujo operativo.

## Drawer

El drawer inicia con la misma jerarquia que la card:

- Nombre grande.
- Persona/rol/oficina/zona.
- Estado y resumen comercial.
- Mensaje recomendado.
- Acciones principales.

Las pestanas siguen existiendo para contacto, mensaje, seguimiento, propuesta, auditoria y notas, pero ya no compiten con la decision primaria de contacto.

## Guardrails

- No se tocaron `.env` ni credenciales.
- No se cambiaron endpoints.
- No se automatizo envio de mensajes.
- La escritura a Google Sheets sigue usando las mismas acciones existentes.
