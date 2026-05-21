# Memoria del Proyecto

## Arquitectura objetivo del CRM

- El CRM local debe evolucionar hacia una fuente de verdad conectada a Google Sheets.
- Google Sheets debe guardar el estado real de cada prospecto para evitar reenviar mensajes a la misma persona.
- El identificador principal del prospecto debe ser el telefono normalizado, combinado si hace falta con nicho/campana/fuente.
- Antes de abrir WhatsApp, el CRM debe verificar en Sheets que el prospecto siga en un estado enviable.
- Estados que deben bloquear reenvios: Contactado, Interesado, Seguimiento, Llamada, Cita, Respondio, No interesado, Referido.
- Flujo deseado:
  1. Buscar prospecto pendiente y cualificado.
  2. Marcarlo como En proceso o bloqueado temporalmente.
  3. Abrir WhatsApp con mensaje personalizado.
  4. Al cerrar o confirmar envio, marcar Contactado, guardar fecha y aumentar conteo.
  5. Saltar automaticamente contactos ya trabajados y pasar al siguiente pendiente.
- El sistema debe ser multinicho:
  - Opcion inicial: varias hojas de Google Sheets por nicho.
  - Opcion escalable: una hoja maestra con columna Nicho/Campana.
- El CRM debe permitir prospectar abogados, esteticas, inmobiliarias, productos para el pelo u otros nichos sin rutas hardcodeadas.
- Para la fase actual, Google Sheets es suficiente como backend liviano.
- Si el volumen o los usuarios crecen, conviene migrar la base a Supabase/Postgres y usar Sheets como importacion/exportacion.
- Despliegue objetivo: GitHub + Vercel + API segura de Google Sheets.
- La prioridad es mantener control anti-bloqueo, seguimiento comercial, llamadas, citas y estados del pipeline.
