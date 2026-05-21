# Robust Multinicho Prospector Requirements

## Proposito

Definir los requisitos del prospector futuro que alimentara Luma Outreach Console con prospectos B2B de multiples nichos. El objetivo es vender implementaciones digitales Luma Premium, no vender propiedades ni convertir la consola en un CRM inmobiliario.

## Alcance

El prospector debe buscar prospectos por nicho y producir registros `unified_lead` listos para revision, importacion local y posterior sincronizacion con Google Sheets maestro.

Nichos iniciales:

- Real estate: inmobiliarias, brokers, agentes y equipos comerciales.
- Developers: constructoras, desarrolladores y proyectos que necesitan infraestructura digital.
- Academy: academias, cursos, talleres y formacion.
- Beauty: estetica, spas, odontologia estetica y belleza.
- Route products: rutas, catalogos, promotores y productos.
- Printing graphics: imprentas, letreros y servicios graficos B2B.
- Professional services: abogados, contables, fotografos, consultores y profesionales independientes.
- B2B services: seguridad, limpieza, mantenimiento, industrial y logistica.

## Reglas obligatorias

- No hacer scraping desde la app Next.js.
- No automatizar WhatsApp.
- No automatizar Instagram.
- No automatizar LinkedIn.
- No hacer git push.
- No tocar `.env`.
- No subir datos reales al repo.
- No scrapear detras de login.
- No hacer scraping agresivo de Instagram o LinkedIn.
- Usar fuentes publicas y accesibles sin autenticacion.
- Ejecutar siempre en modo dry-run antes de escribir archivos finales.
- Registrar logs de ejecucion, errores, fuentes consultadas, filas nuevas, filas duplicadas y filas omitidas.
- Manejar errores por fuente o fila sin romper la ejecucion completa.
- No sobrescribir datos originales; escribir salidas nuevas versionadas o staging.

## Contrato `unified_lead`

Cada salida debe producir un registro compatible con la consola:

- `id`
- `nicho`
- `prioridad`
- `nombre_negocio`
- `nombre_persona`
- `cargo_rol`
- `empresa_marca`
- `web`
- `audit_domain`
- `reporte_luma`
- `whatsapp`
- `telefono`
- `correo`
- `instagram`
- `facebook`
- `linkedin`
- `ciudad_zona`
- `fuente_dato`
- `fuente_auditoria`
- `senal_comercial`
- `dolor_probable`
- `oportunidad_visible`
- `oferta_recomendada`
- `angulo_contacto`
- `mensaje_whatsapp`
- `mensaje_instagram`
- `asunto_email`
- `mensaje_email`
- `estado`
- `proximo_paso`
- `notas`
- `metricas_publicas_json`
- `atributos_nicho_json`
- `audit_raw_ref`
- `csv_raw_ref`
- `imported_at`

## Instagram-only

Instagram-only es un prospecto valido cuando hay `instagram` y al menos `nombre_negocio` o `nombre_persona`.

Reglas:

- No marcar como malo por faltar web, WhatsApp o correo.
- Canal recomendado: Instagram.
- Badge esperado en consola: `Instagram-only`.
- Si existe `mensaje_instagram`, estado sugerido: `listo_contacto`.
- Si falta `mensaje_instagram`, preparar fallback consultivo de permiso antes de observacion.
- No decir "no tienes web" como ataque.
- No iniciar con score.

## Datos faltantes

El prospector no debe inventar telefonos, correos, metricas, nombres, handles ni dominios.

Cuando falte un dato, usar:

`No visible`

Esto aplica a:

- telefono
- WhatsApp
- correo
- Instagram
- LinkedIn
- web
- metricas publicas
- cargo o rol
- ciudad o zona

## Datos observados vs inferencias comerciales

Separar claramente:

- Datos observados: nombre, URL, handle, telefono visible, email visible, ciudad visible, fuente.
- Inferencias comerciales: dolor probable, oportunidad visible, oferta recomendada, prioridad, angulo de contacto.

Las inferencias deben ser conservadoras y basadas en senales publicas.

## Deduplicacion

Deduplicar por:

1. Dominio normalizado.
2. Telefono o WhatsApp normalizado.
3. Instagram normalizado.
4. Correo normalizado.
5. Nombre de negocio + ciudad.

El prospector debe registrar en logs que regla detecto el duplicado.

## Fuentes publicas permitidas

- Sitios web publicos.
- Directorios publicos.
- Resultados de buscadores cuando el metodo sea permitido.
- Paginas publicas de negocio.
- Perfiles publicos visibles sin login.
- Archivos CSV/XLSX entregados manualmente por Marcos.

## Salidas esperadas

Cada ejecucion debe generar:

- CSV staging por nicho.
- JSON staging por nicho.
- Log Markdown de ejecucion.
- Reporte de duplicados.
- Reporte de errores.
- Resumen de conteos por canal: WhatsApp, Instagram, email, LinkedIn, web/manual, sin canal.
- Resumen de Instagram-only.
- Archivo listo para importar a la consola.
- Archivo listo para Google Sheets maestro.

## Preparacion para Google Sheets maestro

El prospector debe generar columnas compatibles con `Prospectos_Master` y con las pestanas por nicho definidas en `docs/30_SHEETS_SCHEMA_MULTINICHO_OUTREACH.md`.

No debe crear modelos de propiedades, proyectos inmobiliarios ni relaciones lead-propiedad.

