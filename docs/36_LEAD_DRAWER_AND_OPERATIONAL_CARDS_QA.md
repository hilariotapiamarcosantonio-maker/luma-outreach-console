# QA - Lead Drawer y Operational Cards

Fecha: 2026-05-22

## Problema que resolvio

La consola ya podia leer y guardar Google Sheets, pero Marcos tenia que saltar entre vistas para operar. Prospectos, Lote de Hoy, Seguimiento y Propuestas mostraban informacion, pero no funcionaban como cabina comercial diaria para contactar, cambiar estado, preparar propuesta y guardar contexto.

## Cambios realizados

- Se agrego `LeadOperationalCard` como card reutilizable para vistas operativas.
- Se agrego `LeadDetailDrawer` universal para abrir detalle completo desde cada lead.
- Se agrego `PrepareProposalModal` como modal reutilizable para preparar propuesta sin envio automatico.
- Se redujeron textos largos por defecto: mensaje, senal, oportunidad y notas ahora muestran preview de 1-2 lineas con Ver mensaje / Ver mas / Copiar completo.
- Se mantuvo apertura manual de canales: WhatsApp, Instagram, email, web y demo.
- Se removio el modo compacto visible anterior para evitar la lista cruda.
- Se amplio el resumen visual de lote desde Sheets con motivo principal y conteo de leads sin mensaje importado.

## Prospectos

- Cada lead se muestra como card operativa con datos de contacto arriba.
- Acciones visibles: Ver detalles, Copiar mensaje, WhatsApp, Instagram, Email y Guardar.
- La card permite cambiar estado, asignar canal usado, preparar propuesta y abrir web/demo sin ir a Lote de Hoy.
- La busqueda cubre nombre, negocio, persona, telefono, WhatsApp, Instagram, email, nicho, estado, oferta y notas.

## Lote de Hoy

- Lote de Hoy usa las mismas cards operativas.
- El modo compacto anterior queda fuera del flujo visible.
- La busqueda local mantiene el caso de uso "Eddy Veras" y revisa datos de contacto, nicho, estado, oferta y notas.
- El resumen de lote desde Sheets muestra:
  - Total evaluados
  - Incluidos
  - Con WhatsApp
  - Con Instagram
  - Excluidos por estado
  - Excluidos por falta de canal
  - Excluidos por contacto reciente
  - Sin mensaje
  - Motivo principal

## Seguimiento

- Seguimiento ahora usa cards completas, no tarjetas minimas.
- Cada lead muestra contacto visible, estado, canal, proximo paso, fecha, oferta, ticket, demo, mensaje y notas colapsadas.
- Acciones disponibles: copiar mensaje, abrir WhatsApp, abrir Instagram, copiar email, abrir web, marcar llamada, marcar propuesta enviada, marcar seguimiento, guardar en Sheets y preparar propuesta.
- El drawer conserva el contexto completo para continuar manana sin perder trazabilidad.

## Propuestas

- Propuestas opera como pipeline comercial.
- Cada lead muestra quien es, oferta, ticket, demo, canal, fecha, link, estado de propuesta y proximo paso.
- Acciones disponibles: Ver detalles, Preparar propuesta, Copiar resumen, Abrir demo, Guardar link, Guardar material/demo, Marcar negociando, Marcar cerrado, Marcar perdido y Guardar en Sheets.
- El modal Preparar propuesta permite pegar link, registrar nota y guardar en Sheets sin enviar automaticamente.

## Como probar busqueda

1. Abrir Prospectos, Lote de Hoy, Seguimiento o Propuestas.
2. Buscar por un nombre real como `Eddy Veras`.
3. Repetir con telefono, WhatsApp, Instagram, email, nicho, estado, oferta o nota.
4. Confirmar que el resultado aparece sin cambiar de vista y que la card conserva acciones visibles.

## Como probar guardar en Sheets

1. En cualquier card, cambiar estado a Contactado, Seguimiento, Llamada o Propuesta enviada.
2. Confirmar toast grande con el nombre del lead, nuevo estado y texto `Guardado en Sheets` o `Pendiente de guardar en Sheets`.
3. Usar Guardar en Sheets desde la card o drawer.
4. Sincronizar desde Sheets y confirmar que el estado visible se mantiene.

## Como probar movil

1. Abrir la consola en viewport movil.
2. Confirmar que contacto, estado, canal y botones principales quedan visibles arriba.
3. Abrir Ver detalles y confirmar que el drawer ocupa el ancho disponible.
4. Abrir WhatsApp desde movil y confirmar que usa enlace manual compatible con `wa.me` / `api.whatsapp.com`.
5. Confirmar que no se envia ningun mensaje automaticamente.

## Pendiente

- Afinar campos editables inline para monto, fecha propuesta y decision status dentro de la nueva card si Marcos quiere editar esos datos sin abrir Sheets.
- Definir reglas de color por etapa de propuesta cuando haya mas volumen real.
- Validar con video real si la densidad de botones es suficiente para 50-100 contactos diarios o conviene una barra de acciones fija.
