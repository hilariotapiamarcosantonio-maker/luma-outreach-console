# Modelo Operativo Multinicho

## Principio

Vender primero. Optimizar despues. Construir solo lo que el cliente pague.

La consola acepta leads de varios nichos en un mismo modelo `unified_lead`, pero mantiene lectura comercial por nicho: oferta, ticket, canal, estado, seguimiento y propuesta.

## Nichos soportados

| Nicho | Label | Oferta | Ticket |
|---|---|---|---|
| `real_estate` | Inmobiliarias / brokers / agentes | Luma Estate OS Foundation | RD$75,000 - US$3,000+ |
| `developers` | Constructoras / desarrolladores / proyectos | Landing de proyecto + filtro + CRM + dashboard | RD$90,000 - US$3,000+ |
| `academy` | Academias / cursos / talleres | Academia OS | RD$25,000 - RD$90,000+ |
| `beauty` | Estetica / spas / odontologia / belleza | Luma Beauty OS | RD$35,000 - RD$90,000+ |
| `route_products` | Rutas / productos / promotores / catalogo | Luma Route OS | RD$50,000 - RD$150,000+ |
| `printing_graphics` | Imprentas / letreros / servicios graficos B2B | Luma B2B Quote OS | RD$45,000 - RD$150,000+ |
| `professional_services` | Abogados / contables / fotografos / consultores | Luma Professional OS | RD$25,000 - RD$90,000+ |
| `b2b_services` | Seguridad / limpieza / mantenimiento / industrial / logistica | Luma B2B OS | RD$75,000 - RD$150,000+ |

## Campos principales

La consola esta preparada para estos campos:

```text
id
nicho
prioridad
nombre_negocio
nombre_persona
cargo_rol
empresa_marca
web
audit_domain
audit_slug
reporte_luma
whatsapp
telefono
correo
instagram
facebook
linkedin
ciudad_zona
fuente_dato
fuente_auditoria
senal_comercial
dolor_probable
oportunidad_visible
oferta_recomendada
angulo_contacto
mensaje_whatsapp
mensaje_instagram
asunto_email
mensaje_email
estado
tipo_respuesta
proximo_paso
fecha_contacto
fecha_seguimiento
notas
score_interno
score_captacion
score_autoridad
score_medicion
score_seguimiento
score_mobile
ultimo_canal_usado
cantidad_contactos
fecha_ultima_actualizacion
atributos_nicho_json
metricas_publicas_json
audit_raw_ref
csv_raw_ref
```

Tambien mantiene compatibilidad con campos antiguos de WA Vortex: `name`, `businessName`, `phone`, `suggestedMessage`, `painPoint`, `contactAngle`, `sourceUrl`, `email`, `city`, `status`, `notes`.

## Canal recomendado

La consola calcula canal recomendado asi:

1. WhatsApp visible.
2. Instagram visible.
3. Email visible.
4. Sin canal.

Esto no envia mensajes. Solo ayuda a decidir como contactar manualmente.

## Como importar nuevos nichos

1. Crear un CSV normalizado con columna `nicho`.
2. Usar una de las claves soportadas: `real_estate`, `developers`, `academy`, `beauty`, `route_products`, `printing_graphics`, `professional_services`, `b2b_services`.
3. Incluir al menos un canal: `whatsapp`, `instagram` o `correo`.
4. Incluir mensaje por canal si existe.
5. Importar desde la seccion Importar.
6. Revisar Command Center y Nichos para confirmar conteos.

La importacion acumula nichos en el estado local: si un lead ya existe, se actualiza y preserva estado/notas; si pertenece a otro nicho previamente cargado, se conserva.

## Preparacion para 500-1,000 leads

La app ya separa:

- Leads por nicho.
- Leads listos por canal.
- Leads sin canal.
- Leads en revision.
- Leads en seguimiento.
- Llamadas.
- Propuestas.

El siguiente paso estructural es sincronizar cada nicho con Google Sheets o una base local, manteniendo exportacion CSV como backup operativo.
