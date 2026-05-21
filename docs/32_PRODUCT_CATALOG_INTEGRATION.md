# Product Catalog Integration

## Fuente

La integracion toma como referencia comercial `G:\Sistema de Prospectar Marcos Hilario\docs\31_LUMA_COMMERCIAL_STRATEGY.md`.

Ese documento define el catalogo de implementaciones de Luma Premium y sus demos asociadas. Luma Outreach Console usa ese catalogo para recomendar oferta, ticket y demo por nicho, sin convertir la consola en un CRM inmobiliario ni en una herramienta para vender propiedades.

## Archivos conectados

- `src/data/products.ts`: fuente estructurada del catalogo comercial.
- `src/data/niches.ts`: mapa de nichos hacia producto recomendado, ticket y demo.
- `src/lib/utils.ts`: inferencia de producto por lead y mensajes consultivos por canal.
- `src/lib/leadImport.ts`: fallback de oferta al importar leads sin `oferta_recomendada`.
- `src/components/LumaOutreachConsole.tsx`: visualizacion de producto, ticket y demo en leads, nichos y propuestas.

## Productos integrados

- Luma Estate OS Starter
- Luma Estate OS Foundation
- Academia OS
- Luma Beauty OS
- Luma Commerce OS
- Luma Route OS
- Luma B2B Quote OS
- Luma Professional OS
- Luma B2B Industrial OS
- Luma Content/Monetization OS

## Demos asociadas

- Estate OS Starter: Vista del Rio.
- Estate OS Foundation: Vista del Rio.
- Academia OS: Suvoga OS.
- Beauty OS: Santuario Estetica MVP.
- Commerce OS: Luma Capilar.
- Route OS: Panel de consola operativa.
- B2B Quote OS: Depot Graphics.
- Professional OS: Portafolio Premium.
- B2B Industrial OS: Inox Minier.
- Content/Monetization OS: Gelatinas y Postres.

## Reglas de inferencia

1. Si el lead trae `oferta_recomendada` valida, se respeta.
2. Si el lead inmobiliario parece broker/agente sin web, se recomienda `Luma Estate OS Starter`.
3. Si el lead es inmobiliaria, agencia, desarrollador o constructora, se recomienda `Luma Estate OS Foundation`.
4. Si el nicho es academia, se recomienda `Academia OS`.
5. Si el nicho es beauty, se recomienda `Luma Beauty OS`, salvo que el contexto sea claramente tienda de productos, donde puede mapear a `Luma Commerce OS`.
6. Si el nicho es comercio, tienda, retail, cosmeticos o productos fisicos, se recomienda `Luma Commerce OS`.
7. Si el nicho es rutas, distribucion, despacho, reparto, choferes o cobradores, se recomienda `Luma Route OS`.
8. Si el nicho es imprenta, graficos o cotizacion tecnica, se recomienda `Luma B2B Quote OS`.
9. Fotografos se manejan asi:
   - `Luma Professional OS` cuando el foco visible es autoridad profesional, agenda o marca personal.
   - `Luma B2B Quote OS` cuando el foco visible es cotizacion por evento, proyecto, paquete, brief o archivos.
10. Si el nicho es B2B industrial, seguridad, mantenimiento o logistica corporativa, se recomienda `Luma B2B Industrial OS`.
11. Si el nicho es contenido, recetas, blog o infoproductos, se recomienda `Luma Content/Monetization OS`.

## Mensajes base

Los mensajes viven en `src/data/products.ts` dentro de `baseMessages`. Son consultivos y siguen estas reglas:

- Pedir permiso antes de compartir observacion.
- Basarse en senales publicas.
- No iniciar con score.
- No prometer resultados agresivos.
- No decir que el negocio esta mal.
- No automatizar envio.
- Mantener WhatsApp e Instagram como contacto manual asistido.

## Propuestas

La seccion Propuestas ahora muestra:

- Prospecto.
- Nicho.
- Oferta recomendada.
- Ticket sugerido.
- Demo asociada.
- Estado.
- Proximo paso.
- Nota comercial.
- Link de propuesta.
- Link de material o demo.
- Monto estimado.

La demo asociada sale del producto inferido. Si el lead no tiene `material_link`, la consola usa el link de demo del catalogo como fallback visual.

## Separacion Commerce OS y Route OS

`Luma Commerce OS` y `Luma Route OS` son productos separados.

- Commerce OS: catalogo, variantes, pedidos y WhatsApp Checkout para productos fisicos.
- Route OS: rutas, despachos, choferes, cobradores, visitas, cobros e inventario en calle.

No deben mezclarse en copy, filtros ni propuestas.

## Seguridad operacional

Esta integracion no:

- toca datos reales;
- ejecuta scanners;
- automatiza WhatsApp;
- automatiza Instagram;
- cambia `.env`;
- hace scraping desde la app;
- convierte Luma Outreach en CRM inmobiliario;
- crea modelo de propiedades o relacion lead-propiedad.

