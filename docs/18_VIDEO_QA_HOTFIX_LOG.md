# Video QA Hotfix Log

## Problemas detectados

- La consola podia abrir con 90, 103 u otros conteos por imports acumulados en localStorage.
- El flujo de importacion no diferenciaba claramente reemplazar workspace vs agregar leads.
- Una fila tipo header, como `Nombre del negocio / perfil`, podia entrar como lead real.
- Algunos leads inmobiliarios quedaban como `Sin nicho`.
- La oferta podia aparecer como `Oferta Luma por definir` aunque el nicho permitia inferir `Luma Estate OS Foundation`.
- `senal_comercial` y `oportunidad_visible` quedaban en estados genericos poco utiles para operar.
- El mensaje de WhatsApp podia usar una apertura demasiado fria basada en Plusval.
- Lote de Hoy necesitaba controles rapidos para trabajar 50-100 contactos.

## Que se corrigio

- Se agrego Gestion del workspace local en Importar y Configuracion.
- Se agrego limpieza de workspace local con confirmacion:
  `Esto no borra tus archivos originales. Solo limpia la consola local.`
- Se agrego exportacion de backup / estado actualizado antes de limpiar.
- Se agrego resumen de dataset activo:
  - leads cargados
  - ultimo archivo importado
  - fecha de importacion
  - modo usado
  - nichos activos
- El modo de importacion ahora existe y por defecto es `Reemplazar workspace actual`.
- La importacion ahora tiene preview antes de guardar:
  - archivo detectado
  - filas leidas
  - filas validas
  - filas ignoradas
  - conteos por canal
  - nichos detectados
  - headers detectados
  - posibles filas basura
- El importador ignora filas header-like y filas estructurales.
- El importador exige identidad o canal real antes de crear un lead.
- Se fortalecio el mapeo de `unified_lead`, nombres con espacios, snake_case y campos legacy.
- Se infiere `real_estate` desde senales como Plusval, inmuebles, propiedades, brokers, agentes, inmobiliaria, residencial, turistico e inversion.
- Se agregan fallbacks comerciales por nicho para oferta, oportunidad visible y senal comercial.
- La UI usa mensaje WhatsApp safe por defecto y deja el mensaje original como referencia secundaria.
- Lote de Hoy ahora tiene progreso, pendientes, respondieron, interesados, siguiente contacto recomendado, filtros rapidos y modo compacto.
- La exportacion agrega `estado_visual`, `batch_name` e `imported_file_name`.

## Como probar limpio

1. Correr local con el comando seguro:

```cmd
cd /d "G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp"
npm run dev:webpack
```

2. Ir a Importar o Configuracion.
3. Usar `Exportar backup antes de limpiar` si hay datos que quieras conservar.
4. Usar `Limpiar workspace local`.
5. Confirmar el aviso.
6. En Importar, dejar seleccionado `Reemplazar workspace actual`.
7. Seleccionar:

```cmd
G:\Sistema de Prospectar Marcos Hilario\data_normalized\real_estate\outreach_batches\first_50_manual_outreach.csv
```

8. Revisar el preview.
9. Confirmar importacion.

## Que debe verse si todo esta correcto

- 50 leads cargados si el archivo tiene 50 filas validas.
- No deben aparecer headers como leads.
- Nicho visual: `Inmobiliarias`.
- Oferta: `Luma Estate OS Foundation`.
- Mensajes WhatsApp safe por defecto.
- KPIs reales segun el workspace activo.
- Lote de Hoy con progreso `0 / 50` antes de contactar.
- Exportacion disponible desde Configuracion.

## Pendiente

- No se ha ejecutado build.
- No se ha ejecutado lint.
- No se ha probado visualmente desde esta fase por las reglas de no ejecutar dev.
- Google Sheets sigue pendiente.
- No esta listo para deploy.
- No esta listo para 1,000 leads hasta validar importacion limpia con el lote de 50.

## Que no hacer aun

- No desplegar.
- No conectar Google Sheets.
- No ejecutar scanners.
- No tocar Luma Intelligence Hub.
- No tocar datasets originales.
- No usar APIs de WhatsApp.
- No automatizar envio ni clicks.

