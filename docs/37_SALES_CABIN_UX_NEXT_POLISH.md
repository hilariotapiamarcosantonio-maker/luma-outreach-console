# Sales Cabin UX Next Polish

Fecha: 2026-05-22

## Analisis del video

La revision completa de 11 minutos dejo claro que la consola ya funcionaba como CRM operativo, pero todavia obligaba a Marcos a saltar mentalmente entre secciones y bloques largos. El flujo real de venta es mas corto: buscar lead, abrir detalle, contactar manualmente, confirmar lo que paso, guardar estado, dejar seguimiento o preparar propuesta.

El criterio de este polish fue convertir Prospectos y Detalle en una cabina diaria de ventas: menos lectura abierta por defecto, acciones visibles arriba, contacto manual seguro y confirmacion posterior antes de tocar estados.

## Bugs y fricciones corregidas

- Prospectos ahora concentra las acciones principales por lead: ver detalle, copiar mensaje, abrir WhatsApp, abrir Instagram, copiar email, abrir web, preparar propuesta y guardar en Sheets.
- LeadDetailDrawer fue reorganizado en tabs internas: Resumen, Contacto, Mensaje, Seguimiento, Propuesta, Auditoria y Notas.
- El drawer en mobile usa pantalla completa, tabs tactiles y datos de contacto arriba.
- Despues de abrir WhatsApp, abrir Instagram o copiar email aparece la confirmacion "Contactaste este lead?" con Marcar Contactado, Programar Seguimiento y No todavia.
- El contacto no se marca automaticamente; solo se actualiza canal localmente para contexto.
- El resumen de lote creado queda compacto: "Lote creado: X incluidos" y despliegue de razones.
- URLs largas de Instagram, web, email, demo y propuesta se truncaron visualmente en componentes operativos y se exponen mediante botones Abrir/Copiar.
- Propuestas se separo como pipeline: Plantillas disponibles, Propuestas por enviar, Propuestas enviadas, Negociaciones activas y resultados cerrados/perdidos cuando existan.
- Cada lead en propuesta muestra oferta, ticket, demo, canal, fecha, link, proximo paso y notas.
- Se agrego boton contextual Volver para rutas de nicho, lote, prospecto y propuestas sin depender del navegador.
- Se implemento sincronizacion simple de URL/query con `?section=`, `?niche=` y `?lead=`.

## Seguridad operativa

- No se tocaron `.env` ni credenciales.
- No se cambio el contrato de Google Sheets ni sus endpoints.
- No se implemento prospector, scraping ni envio automatico.
- WhatsApp, Instagram y email siguen siendo acciones manuales.
- No se borran datos; los cambios de estado siguen pasando por las funciones existentes de guardado.

## Pruebas

- `npm run build` paso correctamente con Next.js 16.2.6 y Turbopack.
- TypeScript completo sin errores.
- Rutas app generadas correctamente, incluyendo consola, nicho, lote, prospecto, propuestas y endpoints de Sheets.
- Verificacion en navegador local: `?section=prospectos` renderiza Prospectos y `?section=propuestas` renderiza Plantillas disponibles, Propuestas por enviar, Propuestas enviadas y Negociaciones activas.

## Pendientes

- Agregar fecha/hora editable para "Programar Seguimiento" en vez del default existente.
- Persistir un historial de eventos por lead para auditoria cronologica completa.
- Convertir algunos botones de copia secundaria a feedback con toast unificado.
- Revisar visualmente en navegador con data real despues del build para afinar densidad de cards por viewport.
