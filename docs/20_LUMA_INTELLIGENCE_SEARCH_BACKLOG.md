# Luma Intelligence Search Backlog

## Objetivo

Preparar Luma Intelligence para operar con 111, 500 o mas auditorias sin perder velocidad de busqueda, contexto comercial ni acceso rapido a cada reporte.

No modificar Luma Intelligence en esta fase.

## Necesidades principales

- Buscador global por dominio, empresa, persona, ciudad, nicho y notas.
- Filtro por dominio.
- Filtro por empresa.
- Filtro por score.
- Filtro por nicho.
- Filtro por estado de auditoria.
- Vista compacta para volumen.
- Acceso rapido a `/audit/[domain]`.
- Indicadores de auditoria incompleta, dominio no validado y datos sin canal.

## Prioridad operativa

Con 111 auditorias la busqueda manual ya empieza a ser lenta; con 500 o mas seria impracticable. La primera version debe priorizar encontrar rapido una auditoria por dominio, empresa, usuario, nicho o score, y abrir el reporte `/audit/[domain]` sin navegar card por card.

## Vista compacta sugerida

Cada fila debe mostrar:

- Empresa
- Dominio
- Nicho
- Score principal
- Estado de auditoria
- Canal comercial visible
- Fecha de auditoria
- Accion rapida para abrir `/audit/[domain]`

## Filtros sugeridos

- Score alto, medio, bajo.
- Auditoria completa.
- Auditoria incompleta.
- Dominio no validado.
- Sin web.
- Solo Instagram.
- Nicho pendiente.
- Prospecto ya exportado a Outreach Console.

## Riesgos

- Renderizar cientos de auditorias como cards grandes.
- No diferenciar dominio real, audit_domain y slug de auditoria.
- Mezclar estados tecnicos de auditoria con estados comerciales.
- Perder acceso rapido a reportes cuando el volumen supere 500 registros.

## Estado

Backlog documentado. No implementar cambios en Luma Intelligence todavia.
