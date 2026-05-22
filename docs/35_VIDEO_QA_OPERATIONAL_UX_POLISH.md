# Video QA - Operational UX Polish

## Bugs detectados

- Command Center mostraba "Ocho frentes comerciales" aunque la consola renderiza 10 frentes/nichos comerciales.
- Los lotes creados desde Sheets no explicaban por que entraban pocos leads.
- Prospectos funcionaba como lectura/filtro, pero no como superficie de contacto diaria.
- Lote de Hoy, Seguimiento y Propuestas no tenian busqueda local dedicada.
- Seguimiento no mostraba todos los datos necesarios para retomar contexto al dia siguiente.
- Propuestas indicaba estado, pero faltaba reforzar que oferta, ticket, demo, canal, fecha y link se enviaron.
- El guardado a Sheets podia escribir estados internos no compatibles con dropdowns visibles.
- Modo compacto se sentia como lista cruda y no como tabla operativa premium.

## Mejoras UX realizadas

- Conteo de frentes comerciales calculado desde nichos/productos visibles.
- Buscador local agregado en Lote de Hoy, Seguimiento y Propuestas.
- Prospectos convertido en vista operable con acciones directas por lead.
- Contacto visible arriba en cards/filas: WhatsApp, Instagram, email y web.
- Acciones por lead: copiar mensaje, abrir WhatsApp, abrir Instagram, copiar email, abrir web, marcar llamada, preparar propuesta, marcar propuesta enviada y guardar en Sheets.
- Seleccion rapida por checkbox, seleccionar visible, limpiar seleccion y acciones masivas.
- Modo compacto redisenado como fila operativa con estado, canal, contacto y acciones.
- Toasts mas grandes con textos claros de "Guardado en Sheets" o "Pendiente de guardar en Sheets".
- WhatsApp abre `web.whatsapp.com` en desktop y `api.whatsapp.com` en mobile, siempre con accion manual.

## Cambios realizados

- `src/components/LumaOutreachConsole.tsx`
  - Nuevos estados UI para busquedas por vista, seleccion, expansion de prospectos, resumen de lote y modal de propuesta.
  - Resumen visible de lote desde Sheets: total evaluados, con WhatsApp, con Instagram, excluidos y incluidos.
  - Modal "Preparar propuesta" con oferta, ticket, demo, mensaje sugerido, canal recomendado, link de propuesta y guardado manual.
  - Seguimiento ampliado con datos completos y botones operativos.
  - Propuestas ampliado con campos comerciales completos y buscador.

- `src/lib/server/googleSheets.ts`
  - `createBatchFromSheet` devuelve resumen de elegibilidad del lote.
  - Estados internos se normalizan antes de escribir en Sheets.
  - Mapeo compatible con dropdowns visibles: Pendiente, Contactado, Respondio, Seguimiento, Llamada, Propuesta enviada, Negociando, Cerrado, No interesado, Referido, Sin accion por ahora y Descartado.
  - Se agregaron campos operativos de propuesta al allowlist de escritura segura.

- `src/lib/utils.ts`
  - Fallback de mensaje actualizado para leads sin mensaje sugerido.

## Como probar

1. Ejecutar `npm run dev -- --hostname 127.0.0.1 --port 3000`.
2. Abrir `http://127.0.0.1:3000/console/luma-premium`.
3. Sincronizar desde Google Sheets.
4. En Nichos, confirmar que el titulo muestra el total real de frentes.
5. En Lote de Hoy, crear Lote WhatsApp o Instagram y revisar el resumen de elegibilidad.
6. Buscar un lead como "Eddy Veras" en Lote de Hoy, Prospectos, Seguimiento y Propuestas.
7. Desde Prospectos, abrir canal manual, cambiar estado, preparar propuesta y guardar en Sheets.
8. En Seguimiento, validar datos completos, acciones y guardado.
9. En Propuestas, abrir "Preparar propuesta", copiar mensaje, pegar link y guardar.
10. Confirmar en Google Sheets que los estados escritos coinciden con los dropdowns visibles.

## Verificacion realizada

- `npm run build` paso correctamente.
- Browser QA local en `http://127.0.0.1:3000/console/luma-premium`.
- Se verificaron vistas Command Center, Nichos, Lote de Hoy, Prospectos, Seguimiento y Propuestas.
- No aparecieron errores ni warnings de consola durante la revision.

## Pendiente

- Validar con datos reales de Sheets en la maquina de Marcos para confirmar conteos exactos de exclusiones.
- Ajustar copys finales si Marcos prefiere acentos completos en los mensajes comerciales.
- Implementar prospector, DeepSeek o automatizaciones solo cuando se autorice explicitamente.
