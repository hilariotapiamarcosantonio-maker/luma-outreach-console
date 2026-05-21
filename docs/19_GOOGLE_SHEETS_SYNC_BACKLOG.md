# Google Sheets Sync Backlog

## Objetivo futuro

Conectar Luma Outreach Console con Google Sheets/Drive para que el scraper y la consola compartan una fuente operativa por nicho, sin perder trazabilidad de estados, lotes, notas y propuestas.

No implementar en esta fase.

## Modelo esperado

- Una hoja por nicho: inmobiliarias, desarrolladores, academias, beauty/spa, rutas/productos, imprentas/B2B, servicios profesionales y B2B industrial.
- Una hoja indice opcional para ver totales, batch activo, fecha de ultima sincronizacion y conflictos.
- Importacion desde scraper hacia hojas normalizadas.
- Exportacion desde consola hacia hojas, preservando estados comerciales.
- Sincronizacion local-first: la consola no debe enviar mensajes ni automatizar contacto.

## Columnas necesarias

- id
- nicho
- prioridad
- nombre_negocio
- nombre_persona
- cargo_rol
- empresa_marca
- web
- audit_domain
- reporte_luma
- whatsapp
- telefono
- correo
- instagram
- facebook
- linkedin
- ciudad_zona
- fuente_dato
- fuente_auditoria
- senal_comercial
- dolor_probable
- oportunidad_visible
- oferta_recomendada
- angulo_contacto
- mensaje_whatsapp
- mensaje_instagram
- asunto_email
- mensaje_email
- estado
- proximo_paso
- fecha_contacto
- fecha_seguimiento
- followup_due_date
- last_interaction_date
- attempt_count
- last_channel
- conversation_summary
- propuesta_link
- material_link
- monto_estimado
- fecha_propuesta
- decision_status
- notas
- batch_name
- imported_file_name
- imported_at

## Riesgos

- Duplicados por telefono, email, Instagram, dominio o nombre de negocio.
- Estados sobrescritos por una nueva importacion del scraper.
- Nichos mezclados si el archivo viene sin columna clara de nicho.
- Diferencias entre web y audit_domain.
- Filas con solo Instagram que no deben tratarse como errores.
- Conflictos si dos personas editan la hoja y la consola al mismo tiempo.
- Links de propuestas/materiales pegados en filas equivocadas si no hay llave primaria estable.

## Reglas de seguridad

- No automatizar contacto desde Sheets.
- No abrir WhatsApp ni enviar mensajes desde una sincronizacion.
- No sobrescribir estados bloqueados como `sin_accion_por_ahora`, `proposal_sent`, `negotiating`, `closed` o `lost` sin confirmacion.
- No mezclar hojas de nichos en una sola importacion silenciosa.
- Registrar archivo, modo, batch, filas validas e ignoradas antes de cualquier merge.
- Mantener localStorage/exportacion como fallback antes de activar Drive/Sheets.

## Decisiones pendientes

- Definir llave primaria canonica.
- Definir estrategia de merge por nicho.
- Definir si Google Sheets sera fuente maestra o espejo operativo.
- Definir permisos de Drive y estructura de carpetas.
- Definir logs de sincronizacion.

## Estado

Backlog documentado. No conectar Google Sheets/Drive todavia.
