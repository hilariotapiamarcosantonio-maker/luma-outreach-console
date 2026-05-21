# Daily Outreach Playbook

## Objetivo diario

Contactar 50-100 prospectos manualmente, sin spam y sin automatizar WhatsApp.

El objetivo comercial minimo es crear pipeline suficiente para RD$150,000+:

- 6 cierres de RD$25,000.
- 3 cierres de RD$45,000-RD$50,000.
- 2 cierres de RD$75,000.
- 1 cierre de RD$150,000+.
- O implementaciones de US$2,500-US$3,000+.

## Arranque de manana

1. Abrir la app local con:

```cmd
cd /d "G:\Sistema de Prospectar Marcos Hilario\Macro Envio Masivo Whatsapp"
npm run dev:webpack
```

2. Ir a Importar.
3. Importar:

```cmd
G:\Sistema de Prospectar Marcos Hilario\data_normalized\real_estate\outreach_batches\first_50_manual_outreach.csv
```

4. Revisar Command Center.
5. Trabajar desde Lote de Hoy.

## Ritmo recomendado

Trabajar en bloques de 25:

1. Contactar 25 prospectos.
2. Pausar 10-15 minutos.
3. Responder conversaciones vivas.
4. Marcar estados y notas.
5. Contactar otros 25.

Si empiezan respuestas reales, detener el volumen y priorizar conversion. La conversacion activa vale mas que completar una lista.

## Estados a usar

- `contacted`: mensaje enviado manualmente.
- `replied`: respondio.
- `interested`: mostro interes.
- `follow_up`: necesita seguimiento.
- `call`: llamada por hacer.
- `appointment`: cita agendada.
- `proposal_sent`: propuesta enviada.
- `negotiating`: negociacion activa.
- `closed`: cerrado.
- `lost`: perdido.
- `not_interested`: no interesado.
- `needs_review`: revisar antes de contactar.
- `buscar_canal`: buscar canal manualmente.
- `discarded`: descartar.

## Cuando detenerse a responder

Detener el contacto frio cuando:

- Hay 3+ conversaciones activas al mismo tiempo.
- Un prospecto pide precio.
- Un prospecto pide ver ejemplo.
- Un prospecto acepta llamada.
- Hay una objecion que puede convertirse en oferta.

Responder rapido y guardar notas. No confiar en memoria.

## Como mover a llamada

Mover a `call` o `appointment` cuando el lead:

- Pide entender la solucion.
- Quiere ver que se encontro.
- Pregunta precio.
- Dice que lo puede conversar.
- Pide que le escriban mas tarde con detalle.

Guion base:

```text
Gracias por tomar la llamada. Te muestro rapido lo que vi desde senales publicas, que puede significar comercialmente y que estructura tendria sentido si deciden mejorarlo.
```

## Como mover a propuesta

Mover a `proposal_sent` cuando:

- Ya hubo llamada o intercambio suficiente.
- Hay dolor claro.
- Hay oferta recomendada.
- Hay proximo paso definido.
- El prospecto acepto recibir estructura o precio.

En notas, guardar:

- Dolor principal.
- Oferta propuesta.
- Ticket sugerido.
- Objecion.
- Fecha de seguimiento.

## Medicion hacia RD$150,000+

Revisar al final del dia:

- Contactados hoy.
- Respuestas.
- Interesados.
- Llamadas agendadas.
- Propuestas enviadas.
- Cierres.
- Nichos con mejor respuesta.

Regla practica:

- Si hay respuestas pero pocas llamadas, mejorar angulo.
- Si hay llamadas pero pocas propuestas, mejorar diagnostico.
- Si hay propuestas pero pocos cierres, mejorar oferta, urgencia y prueba.
- Si no hay respuestas, revisar nicho, canal y primer mensaje.

## Cierre diario

1. Exportar estado actualizado desde Configuracion.
2. Guardar el CSV exportado como backup.
3. Revisar Revision para limpiar sin canal o conflictos.
4. Preparar el siguiente lote.
5. No modificar datasets originales.

