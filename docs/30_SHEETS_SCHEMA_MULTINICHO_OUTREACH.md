# Sheets Schema Multinicho Outreach

## Proposito

Proponer la estructura futura de Google Sheets para operar Luma Outreach Console como sistema comercial multinicho. El objetivo es vender implementaciones Luma Premium, no vender inmuebles.

No hay pestanas maestras para propiedades ni proyectos inmobiliarios en esta fase.

## Pestanas propuestas

### Prospectos_Master

Fuente maestra normalizada para todos los prospectos.

Columnas base:

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
- ticket_sugerido
- angulo_contacto
- mensaje_whatsapp
- mensaje_instagram
- asunto_email
- mensaje_email
- estado
- proximo_paso
- fecha_contacto
- fecha_seguimiento
- ultimo_canal_usado
- cantidad_contactos
- notas
- metricas_publicas_json
- atributos_nicho_json
- audit_raw_ref
- csv_raw_ref
- imported_at
- updated_at

### Real_Estate

Vista filtrada o espejo operativo para inmobiliarias, brokers y agentes.

Campos adicionales sugeridos:

- subsegmento
- broker_agente_sin_web
- oferta_starter_aplica
- landing_autoridad_aplica
- dependencia_instagram_whatsapp

### Developers

Vista para constructoras, desarrolladores y equipos que necesitan captacion/filtro/seguimiento digital.

Campos adicionales sugeridos:

- tipo_desarrollador
- canal_publico_principal
- interes_proyecto_visible
- necesidad_dashboard

### Academy

Vista para academias, cursos y talleres.

Campos adicionales sugeridos:

- tipo_programa
- inscripcion_visible
- calendario_visible
- friccion_whatsapp

### Beauty

Vista para estetica, spas, odontologia estetica y belleza.

Campos adicionales sugeridos:

- servicio_principal
- agenda_visible
- instagram_activo
- oportunidad_reservas

### Route_Products

Vista para rutas, catalogos, promotores y venta por productos.

Campos adicionales sugeridos:

- tipo_catalogo
- canal_pedidos
- zona_operacion
- necesidad_cotizacion

### Printing_Graphics

Vista para imprentas, letreros y servicios graficos B2B.

Campos adicionales sugeridos:

- tipo_servicio
- canal_cotizacion
- evidencia_portafolio
- oportunidad_formulario_brief

### Professional_Services

Vista para abogados, contables, fotografos, consultores y profesionales independientes.

Campos adicionales sugeridos:

- profesion
- servicio_ancla
- autoridad_publica
- oportunidad_agenda

### B2B_Services

Vista para seguridad, limpieza, mantenimiento, industrial y logistica.

Campos adicionales sugeridos:

- categoria_servicio
- tipo_cliente_objetivo
- formulario_cotizacion_visible
- oportunidad_pipeline_b2b

### Daily_Batches

Control de lotes diarios manuales.

Columnas:

- batch_id
- batch_name
- fecha_creacion
- nicho_principal
- filtro_origen
- total_leads
- canal_objetivo
- creado_por
- notas

### Followups

Seguimiento de conversaciones y tareas comerciales.

Columnas:

- followup_id
- lead_id
- fecha_seguimiento
- ultimo_canal
- intento_numero
- estado
- proximo_paso
- resumen_conversacion
- nota
- updated_at

### Proposals

Propuestas de implementacion Luma Premium.

Columnas:

- proposal_id
- lead_id
- prospecto
- nicho
- oferta_recomendada
- ticket_sugerido
- estado
- proximo_paso
- nota_comercial
- propuesta_link
- material_demo_link
- monto_estimado
- fecha_propuesta
- decision_status
- updated_at

### Import_History

Auditoria de importaciones.

Columnas:

- import_id
- file_name
- imported_at
- mode
- rows_read
- valid_rows
- ignored_rows
- resulting_total
- detected_niches
- batch_name
- notes

### Config_Nichos

Configuracion comercial por nicho.

Columnas:

- niche_key
- label
- short_label
- oferta_recomendada
- ticket_sugerido
- prioridad_activa
- mensaje_base_whatsapp
- mensaje_base_instagram
- asunto_base_email
- notas

## Reglas de sincronizacion futuras

- Google Sheets no debe iniciar scraping.
- La consola no debe enviar mensajes automaticos.
- La consola puede importar/exportar CSV para mantener control local.
- El scraper debe preparar datos para Sheets, pero no sobrescribir filas maestras sin revision.
- Los estados comerciales deben vivir en `Prospectos_Master`, `Followups` y `Proposals`.
- Las vistas por nicho pueden ser espejos filtrados o pestanas operativas, pero no deben crear modelos inmobiliarios.
