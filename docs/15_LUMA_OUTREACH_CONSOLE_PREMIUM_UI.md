# Luma Outreach Console - Premium UI

## Que cambio

La pantalla principal dejo de presentarse como WA Vortex CRM y ahora opera como:

```text
Luma Outreach Console
Prospeccion asistida, auditoria preliminar y seguimiento comercial.
Local-first - Manual-safe - Multinicho
by Luma Premium
```

La nueva experiencia es una consola ejecutiva con navegacion interna:

1. Command Center
2. Nichos
3. Lote de Hoy
4. Prospectos
5. Seguimiento
6. Llamadas
7. Propuestas
8. Revision
9. Importar
10. Configuracion

La vista principal ya no es una tabla. El trabajo diario se hace desde cards de prospectos con senal comercial, dolor probable, oportunidad visible, oferta recomendada, angulo, mensajes por canal, notas locales y acciones manuales.

## Que se mantuvo

Se preservo la base util de WA Vortex:

- Importacion CSV.
- Importacion XLSX / XLS.
- Dedupe por identificadores de contacto.
- Persistencia en localStorage.
- Mensajes sugeridos.
- Apertura manual de WhatsApp Web con mensaje prellenado.
- Compatibilidad con campos antiguos como `name`, `businessName`, `phone`, `suggestedMessage`, `status`, `notes`.
- Scripts seguros agregados antes: `dev:webpack`, `dev:lowmem`, `dev:safe`.

## Como correr local seguro

No usar el script normal mientras se diagnostica Turbopack.

```cmd
cd /d "G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp"
npm run dev:webpack
```

Si vuelve el problema de memoria:

```cmd
npm run dev:lowmem
```

O la opcion mas conservadora:

```cmd
npm run dev:safe
```

## Archivo a importar primero

```cmd
G:\Sistema de Prospectar Marcos Hilario\data_normalized\real_estate\outreach_batches\first_50_manual_outreach.csv
```

Despues se pueden importar:

- `unified_leads_real_estate.csv`
- Lotes `ready_whatsapp_priority_high.csv`
- Lotes `ready_instagram_priority_high.csv`
- Lotes `ready_email_priority_high.csv`
- CSVs futuros de academy, beauty, legal, b2b o cualquier archivo compatible con `unified_lead`.

## Que no hace la consola

- No envia WhatsApp automaticamente.
- No usa APIs de WhatsApp.
- No automatiza clicks.
- No ejecuta scanners.
- No toca `public/data/audits.json`.
- No modifica datasets originales.
- No conecta Google Sheets todavia.
- No despliega.

## Que falta antes de deploy

- Probar visualmente en local con `npm run dev:webpack`.
- Validar importacion real del primer lote de 50.
- Hacer QA responsive basico.
- Revisar que no haya referencias visibles a WA Vortex en la UI principal.
- Definir persistencia de largo plazo: Google Sheets por nicho o base local.
- Definir politica de backup del CSV exportado.
- Ejecutar build/lint solo cuando Marcos autorice esa fase.
