# Drawer overflow and action rail hotfix

## Problema detectado

En QA de video se detectó un microerror visual en `LeadDetailDrawer` y `LeadOperationalCard`:

- Scroll horizontal en drawer/card y en secciones desplegadas.
- La action rail sticky podía cubrir contenido operativo.
- Al abrir `Ver mensaje completo` o `Ver datos`, algunas acciones y datos quedaban parcialmente ocultos.
- El bloque de outcome podía quedar lejos del contexto activo.
- Había textos con codificación visible o sin acentos en labels operativos.

## Solución aplicada

- Se reforzaron wrappers con `min-w-0`, `overflow-x-hidden`, `break-words` y truncado visual para datos compactos.
- Se mantuvo `break-all` solo en campos de URL/contacto donde corresponde.
- La rail de acciones dejó de ser sticky para no tapar contenido.
- Las acciones principales del drawer quedaron arriba, antes del mensaje recomendado.
- El bloque `¿Qué pasó con este contacto?` se mantiene visible en card, drawer, mensaje completo y datos desplegados.
- Las tabs del drawer ahora envuelven en varias líneas en lugar de forzar scroll horizontal.
- Se corrigieron labels visibles como `Sin acción`, `Próximo paso`, `No respondió` y `Propuesta enviada`.

## Cómo probar en desktop

1. Abrir la app en un viewport desktop.
2. Ir a `Lote de Hoy`, `Prospectos` o `Propuestas`.
3. Abrir una card con datos largos: URL, Instagram, reporte o propuesta.
4. Confirmar que no aparece scroll horizontal en la página, card ni drawer.
5. Abrir el drawer y cambiar entre tabs.
6. Confirmar que ninguna columna invade otra y que los botones envuelven correctamente.

## Cómo probar en móvil

1. Abrir la app en un viewport móvil.
2. Abrir cualquier lead.
3. Confirmar que el drawer ocupa pantalla completa.
4. Confirmar que las acciones principales están arriba y los botones son fáciles de tocar.
5. Confirmar que no aparece scroll horizontal.
6. Confirmar que WhatsApp/contacto, mensaje y outcome quedan accesibles sin taparse.

## Cómo probar mensaje completo

1. Abrir una card o drawer.
2. Expandir `Ver mensaje completo`.
3. Confirmar que el mensaje hace wrap y no empuja la UI fuera de pantalla.
4. Confirmar que `Copiar completo`, `Abrir WhatsApp`, `Registrar resultado` y `Guardar en Sheets` permanecen visibles como bloque normal.
5. Confirmar que el bloque de outcome aparece dentro del mensaje completo.

## Cómo probar outcome

1. Confirmar que aparece `¿Qué pasó con este contacto?`.
2. Verificar que se muestran estas opciones: `Respondió`, `No respondió`, `Visto / sin respuesta`, `Programar seguimiento`, `No interesado`, `Sin acción por ahora`.
3. Probar cada opción en un lead de prueba o con datos controlados.
4. Confirmar que cambia el estado local, el tipo de respuesta y el próximo paso.

## Cómo probar guardado en Sheets

1. Cambiar outcome, nota o propuesta en un lead.
2. Pulsar `Guardar en Sheets`.
3. Esperar el toast de confirmación.
4. Abrir Google Sheets y buscar el lead.
5. Confirmar que estado, canal, tipo de respuesta, próximo paso, seguimiento, notas o propuesta se guardaron según el cambio hecho.

## Pendientes para próxima fase

- QA visual con datos reales extremos: URLs muy largas, nombres de negocio extensos y notas largas.
- Añadir pruebas visuales automatizadas para drawer/card en mobile y desktop.
- Definir la próxima capa de Luma Intelligence sin automatizar envíos ni scraping.
- Revisar copy final de todos los labels históricos que no bloquean operación diaria.
