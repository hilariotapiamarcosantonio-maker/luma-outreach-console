# Contact Outcome System QA

## Problemas detectados en el video

- Marcos podia abrir WhatsApp y copiar mensajes, pero registrar el resultado exigia volver a buscar acciones o usar controles masivos.
- Estado, tipo de respuesta y proximo paso se estaban tratando como una sola decision, lo que hacia ambiguo diferenciar "seguimiento" de "sin respuesta".
- Despues de abrir WhatsApp, la consola no dejaba suficientemente visible el cierre operativo: que paso y que se guarda.
- Al expandir mensaje completo o datos, las acciones principales quedaban lejos del foco de lectura.
- La busqueda dependia demasiado del texto exacto y no ayudaba bien con nombres parciales, telefonos, Instagram, ciudad o estado.

## Flujo nuevo

1. Marcos revisa la card identity-first.
2. Copia el mensaje o abre WhatsApp manualmente.
3. La misma card muestra "Que paso con este contacto?".
4. Marcos registra resultado: Respondio, No respondio, Visto / sin respuesta, Programar seguimiento, No interesado o Sin accion por ahora.
5. La consola actualiza por separado:
   - Estado.
   - _tipo_respuesta.
   - Proximo paso.
   - Fecha de seguimiento cuando aplica.
6. El guardado muestra confirmacion explicita con lead, estado, tipo de respuesta y proximo paso.

## Estados y tipo_respuesta esperados

| Accion | Estado en Sheets | _tipo_respuesta | Proximo paso | Fecha seguimiento |
| --- | --- | --- | --- | --- |
| Respondio | Respondió | Pendiente de clasificar | Calificar interes y proponer llamada corta | Sin cambio obligatorio |
| No respondio | Seguimiento | Sin respuesta | Hacer seguimiento | +2 dias |
| Visto / sin respuesta | Seguimiento | Visto sin respuesta | Hacer seguimiento | +2 dias |
| Programar seguimiento | Seguimiento | Seguimiento programado | Hacer seguimiento | +2 dias |
| No interesado | No interesado | No interesado | Excluir de proximos lotes | Sin cambio obligatorio |
| Sin accion por ahora | Sin acción por ahora | Sin acción | Pausa temporal; no descartar el lead | Sin cambio obligatorio |

Los valores visibles enviados a la columna Estado deben coincidir con la validacion:

- Pendiente
- Contactado
- Respondió
- Seguimiento
- Llamada
- Propuesta enviada
- Negociando
- Cerrado
- No interesado
- Referido
- Sin acción por ahora
- Descartado

## Como probar Saray Boscán

1. Abrir Prospectos o Lote de Hoy.
2. Buscar `Saray`, `Boscán`, parte del telefono o su Instagram.
3. Abrir WhatsApp desde la card.
4. Confirmar que aparece: "WhatsApp abierto. Que paso?"
5. Pulsar `No respondio`.
6. Verificar toast:
   - Guardado en Google Sheets.
   - Lead: Saray Boscán.
   - Estado: Seguimiento.
   - Tipo de respuesta: Sin respuesta.
   - Proximo paso: Hacer seguimiento.

## Como probar Lorraine

1. Buscar `Lorraine` desde Prospectos.
2. Abrir `Ver mensaje completo`.
3. Confirmar que el panel incluye arriba y abajo:
   - Copiar completo.
   - Abrir WhatsApp.
   - Registrar resultado.
   - Guardar en Sheets.
4. Registrar `Visto / sin respuesta`.
5. Verificar que Estado sea Seguimiento y _tipo_respuesta sea Visto sin respuesta.

## Como probar Vanessa Espaillat

1. Buscar `Vanessa`, `Espaillat`, telefono parcial, ciudad o empresa.
2. Abrir `Ver datos`.
3. Confirmar que la barra fija aparece dentro de la card con copiar, WhatsApp, registrar resultado y guardar.
4. Pulsar `Sin accion por ahora`.
5. Verificar que el lead queda pausado, no descartado:
   - Estado: Sin acción por ahora.
   - _tipo_respuesta: Sin acción.
   - Proximo paso: Pausa temporal; no descartar el lead.

## Como verificar en Sheets

1. Abrir la hoja conectada de Prospectos.
2. Buscar la fila por nombre o _id.
3. Revisar columnas operativas:
   - Estado.
   - _tipo_respuesta.
   - Proximo paso.
   - Fecha de seguimiento.
   - _ultimo_canal_usado.
   - cantidad_contactos.
4. Confirmar que Estado no contiene valores internos como `sin_accion_por_ahora`, `propuesta_enviada` o `no_interesado`.
5. Confirmar que las filas marcadas como No interesado o Descartado quedan fuera de proximos lotes.

## Build

Ejecutar:

```powershell
npm run build
```
