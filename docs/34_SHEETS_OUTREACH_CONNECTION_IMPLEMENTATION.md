# 34 - Sheets Outreach Connection Implementation

Fecha: 2026-05-21  
App: Luma Outreach Console  
Spreadsheet ID: `1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40`

## Hoja Modificada

Se trabajo sobre la hoja real:

`https://docs.google.com/spreadsheets/d/1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40/edit`

Antes de modificar se creo el documento de auditoria:

`AUDIT_Luma_Outreach_Sheets_PreChange_2026-05-21`

URL:

`https://docs.google.com/document/d/1VJEipdurZHJ51plcmdDaDERVXhdp2ywEqpiCrUHZTkU`

La hoja original tenia:

- `Prospectos`
- `Resumen`

El header real de `Prospectos` estaba en `A5:W5`. No habia columnas con prefijo `_` en el header.

## Columnas Agregadas

Se agregaron al final de `Prospectos`, desde `X5:AX5`, sin mover columnas existentes:

- `_id`
- `_audit_domain`
- `_audit_slug`
- `_reporte_luma`
- `_fuente_dato`
- `_fuente_auditoria`
- `_audit_raw_ref`
- `_telefono`
- `_facebook`
- `_linkedin`
- `_oportunidad_visible`
- `_oferta_recomendada`
- `_mensaje_instagram`
- `_asunto_email`
- `_mensaje_email`
- `_tipo_respuesta`
- `_ultimo_canal_usado`
- `_cantidad_contactos`
- `_ts_actualizacion`
- `_score_interno`
- `_score_captacion`
- `_score_autoridad`
- `_score_medicion`
- `_score_seguimiento`
- `_score_mobile`
- `_atributos_nicho_json`
- `_metricas_publicas_json`

No se modificaron datos existentes.

## Pestañas Creadas

Se crearon las pestañas faltantes:

- `Prospectos_Master`
- `Real_Estate`
- `Academy`
- `Beauty`
- `Commerce`
- `Route`
- `Professional_Services`
- `B2B_Services`
- `Daily_Batches`
- `Followups`
- `Proposals`
- `Import_History`
- `Audit_Index`
- `Config_Nichos`

`Config_Nichos` quedo poblada con reglas simples por nicho y catalogo Luma. No se agrego DeepSeek ni ninguna dependencia IA.

## Backend Creado

Archivo principal:

- `src/lib/server/googleSheets.ts`

Responsabilidades:

- Inicializa Google Sheets solo server-side.
- Usa service account con `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY`.
- Lee headers y filas buscando columnas por nombre.
- Normaliza filas al modelo `Contact`.
- Protege columnas manuales.
- Escribe solo columnas permitidas de Outreach.
- Agrega notas con append, no reemplazo.
- Actualiza `_ts_actualizacion`.
- Requiere `confirmAdvancedState=true` si el estado actual en Sheets ya es avanzado.

## Endpoints Creados

- `GET /api/sheets/leads`
- `POST /api/sheets/update-lead`
- `GET /api/sheets/batches`
- `POST /api/sheets/create-batch`
- `POST /api/sheets/proposal`

Todos corren en runtime `nodejs` y no exponen credenciales al frontend.

## Variables Necesarias

Local y Vercel:

```env
GOOGLE_SHEET_ID=1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_TAB_PROSPECTOS=Prospectos
GOOGLE_SHEET_TAB_MASTER=Prospectos_Master
LUMA_HUB_BASE_URL=https://luma-intelligence-hub.vercel.app
```

No subir `.env`. El repo solo contiene `.env.example`.

## Que Puede Escribir Outreach

En `Prospectos`:

- `Estado`
- `Próximo paso`
- `Fecha de contacto`
- `Fecha de seguimiento`
- `Notas` solo append
- `_oferta_recomendada`
- `_mensaje_instagram`
- `_asunto_email`
- `_mensaje_email`
- `_tipo_respuesta`
- `_ultimo_canal_usado`
- `_cantidad_contactos`
- `_ts_actualizacion`
- `_id` solo si esta vacio

En pestañas operativas:

- `Daily_Batches`
- `Proposals`

## Que No Puede Tocar

Outreach no escribe columnas manuales protegidas:

- `Prioridad`
- `Nombre del negocio / perfil`
- `Nombre de la persona`
- `Cargo / rol`
- `Oficina / marca`
- `Nicho`
- `WhatsApp visible`
- `Botón WhatsApp`
- `Correo`
- `Instagram`
- `Ciudad / zona`
- `Cantidad de inmuebles`
- `Reviews / reputación`
- `Señal comercial relevante`
- `Dolor probable`
- `Ángulo de contacto`
- `Fuente URL`

Tampoco automatiza WhatsApp, Instagram ni envio de mensajes.

## UI Conectada

La consola ahora muestra:

- Boton `Sincronizar desde Google Sheets`.
- Boton `Guardar cambios en Sheets`.
- Estado visual conectado/fallback.
- Ultima sincronizacion.
- Guardando.
- Error de sincronizacion.
- Origen por card: Google Sheets, CSV o local.
- `_reporte_luma` o `Reporte pendiente`.
- Boton `Ver Reporte Luma`.

Regla de reporte:

- Si hay `_reporte_luma`, abre esa URL.
- Si no hay `_reporte_luma` pero hay `_audit_slug`, abre `https://luma-intelligence-hub.vercel.app/audit/[audit_slug]`.
- Si no hay ninguno, muestra `Reporte pendiente`.

## Lotes Desde Sheets

La UI puede crear:

- Lote de hoy desde Sheets.
- Lote WhatsApp.
- Lote Instagram DM.
- Lote Email.
- Lote por nicho.
- Lote seguimiento vencido.

Reglas implementadas:

- WhatsApp primero por ranking de canal.
- No incluye `no_interesado`, `cerrado`, `descartado` ni equivalentes.
- No incluye contactado reciente.
- No duplica leads ya presentes en lote activo.
- Registra el batch en `Daily_Batches`.

## Como Probar Local

1. Crear `.env.local` con las variables reales.
2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar:

```bash
npm run dev
```

4. Abrir:

`http://localhost:3000/console/luma-premium`

5. Validar:

- `Sincronizar desde Google Sheets` carga leads.
- Marcar `Contactado` actualiza UI, localStorage y Sheets.
- Abrir WhatsApp no cambia estado automaticamente.
- Crear lote guarda fila en `Daily_Batches`.
- Propuesta enviada crea fila en `Proposals`.

## Como Configurar Vercel

En Project Settings -> Environment Variables agregar:

- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_TAB_PROSPECTOS`
- `GOOGLE_SHEET_TAB_MASTER`
- `LUMA_HUB_BASE_URL`

La private key debe conservar saltos de linea como `\n` si se pega en una sola linea.

## Rollback

Si falla la integracion:

1. Quitar variables de Google en Vercel o dejar vacia la service account.
2. La UI entra en `Modo local fallback`.
3. Mantener CSV import como respaldo.
4. No borrar `Prospectos` ni `Resumen`.
5. Si se quiere retirar la estructura nueva, hacerlo manualmente y solo sobre pestañas creadas en esta fase.
6. Para restaurar estado previo, usar el documento de auditoria pre-cambio como referencia de columnas y pestañas originales.

## Build

Resultado verificado:

```bash
npm run build
```

Build exitoso con rutas API dynamic server-side.
