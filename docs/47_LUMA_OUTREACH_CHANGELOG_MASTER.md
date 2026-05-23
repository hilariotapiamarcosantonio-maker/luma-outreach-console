# 47 - Luma Outreach Changelog Master

**Proyecto:** Luma Outreach Console v1  
**Tecnologías:** Next.js (App Router), TypeScript, Tailwind CSS, Google Sheets API.  
**Estado:** Lanzamiento Estable (v1.0.0)

Este documento centraliza el histórico de cambios, las fases de desarrollo completadas, las decisiones de diseño arquitectónico tomadas y el backlog técnico remanente para futuras iteraciones del sistema.

---

## Fases de Desarrollo Completadas

### Fase 1: Arquitectura Base y Recuperación Local
* **Inicialización Segura del Entorno**: Estructuración del proyecto en Next.js con TypeScript estricto y configuración modular de Tailwind CSS.
* **Sistema de Respaldos (Modo Fallback Local)**: Implementación de almacenamiento local (`localStorage`) para asegurar la persistencia de los prospectos cargados e impedir la pérdida de datos durante caídas de red o fallos de API.
* **Control de Cambios Locales**: Creación de la estructura de parches (`dirtyLeadPatches`) para rastrear cambios no sincronizados con base de datos.

### Fase 2: Integración de Google Sheets API
* **Backend de Conexión Server-Side**: Creación del módulo central de comunicación `googleSheets.ts` encapsulando credenciales confidenciales de Google Service Account.
* **Endpoints Dinámicos de API**:
  * `GET /api/sheets/leads`: Descarga y mapeo dinámico de prospectos.
  * `POST /api/sheets/update-lead`: Escritura segura campo por campo en Sheets sin riesgo de sobrescribir columnas manuales de control de Marcos.
  * `POST /api/sheets/create-batch`: Registro automático de creación de lotes diarios en la pestaña `Daily_Batches`.
  * `POST /api/sheets/proposal`: Envío automático de metadatos de ofertas a la pestaña `Proposals`.
* **Esquema de Columnas Adicionales**: Ampliación segura de la pestaña `Prospectos` (rango `X5:AX5`) agregando columnas del sistema de contacto (estados, outcomes, auditorías, mensajes preestablecidos) sin alterar los datos existentes de Marcos.

### Fase 3: Diseño y Estructura Visual (Drawer & Sidebar Fixes)
* **Inmovilización del Viewport**: Rediseño del layout principal (`h-dvh overflow-hidden`) para bloquear el scroll del navegador general y forzar una experiencia tipo aplicación de escritorio (dashboard de control).
* **Sidebar Desktop Estacionaria**: Fijación del menú lateral (`sticky top-0 h-dvh overflow-y-auto`) permitiendo la navegación continua sin perder de vista los módulos al explorar listas extensas.
* **LeadDetailDrawer Fijo**: Reestructuración del panel de detalle de lead:
  * Encabezado y pestañas de navegación configurados como elementos estáticos (`flex-shrink-0`).
  * Cuerpo de pestañas asignado como única zona con scroll interno (`flex-1 overflow-y-auto`).
  * Barra de acciones inferior fija en la parte inferior (`flex-shrink-0`), asegurando visibilidad constante del botón "Guardar en Sheets".

### Fase 4: Pulido Visual Premium y Optimización de UX (v1 Release)
* **Command Center Compacto**:
  * Integración de `compact={true}` en las `MetricCard` de la segunda fila del pipeline de ventas, mejorando la densidad de información y reduciendo el scroll vertical.
  * Adición de animaciones de elevación sutiles en hover y sombras HSL de alta gama.
* **Tablero Kanban Responsivo para Propuestas**:
  * Reorganización de la pestaña "Propuestas" en una grilla de 4 columnas horizontales en pantallas de escritorio.
  * Diseño de la tarjeta de prospecto dedicada a propuestas (`variant === "proposal"`): ultra-compacta, vertical, con accesos rápidos a demos/materiales y resúmenes de ofertas comerciales.
* **Refinamiento de Tarjetas de Lead**:
  * Ocultado de los paneles pesados de mensaje recomendado y outcome por defecto bajo un interruptor dinámico para limpiar la carga visual del listado de trabajo.
  * Incorporación del componente `LeadNextStepCard` con un gradiente dorado sofisticado e iconos contextuales.
  * Corrección ortográfica exhaustiva de textos en español.

---

## Histórico de Versiones

### [1.0.0] - 2026-05-23 (Release Lock)
* **Añadido**: Documentación oficial del release lock, playbook de replicación, changelog maestro y manual de operaciones.
* **Corregido**: Error de sintaxis en `LumaOutreachConsole.tsx` provocado por etiquetas de cierre incompletas en la barra de acciones rápidas.
* **Verificado**: Compilación de producción exitosa utilizando Next.js y Turbopack.

### [0.9.0] - 2026-05-22
* **Añadido**: Nuevo tablero Kanban para seguimiento y control de cotizaciones enviadas.
* **Modificado**: Comportamiento de expansión en tarjetas para evitar duplicidad del registrador de resultados de contacto.

### [0.8.0] - 2026-05-21
* **Añadido**: Backend de Google Sheets y endpoints de API seguros.
* **Añadido**: Modos locales y fallback por desconexión en frontend.

---

## Despliegue Manual y Configuración

El despliegue está automatizado bajo demanda utilizando la infraestructura de Vercel CLI sin intervención en repositorios de terceros:
```bash
# Ejecutar build de prueba local
npm run build

# Desplegar a producción en Vercel
vercel --prod
```

Las variables de entorno requeridas se administran de forma exclusiva a través del panel de control de Vercel en la nube para garantizar la confidencialidad de la cuenta de servicio de Google Cloud.

---

## Pendientes Futuros (Backlog Post-v1)

Los siguientes requerimientos quedan registrados para una futura fase de desarrollo (v2), una vez que Marcos valide la estabilidad operativa de la v1:

1. **Automatizaciones Controladas (WhatsApp / Instagram)**:
   * Conectar con APIs oficiales o webhooks seguros para automatizar el envío de mensajes sin requerir copia manual, siempre que la plataforma de destino lo permita de forma legal (evitando baneos).
2. **Sistema de Recordatorios Dinámicos (Notificaciones)**:
   * Integración de notificaciones push o alertas del sistema cuando una fecha de seguimiento agendada en Sheets se cumpla, alertando a Marcos directamente en pantalla.
3. **Módulo de Analítica Avanzado**:
   * Generar gráficos de rendimiento comercial basados en la pestaña `Daily_Batches` y `Proposals` para mostrar tasas de conversión reales (Leads contactados vs Respuestas vs Cierres de ventas).
4. **Higiene de Leads en Segundo Plano**:
   * Procesamiento asíncrono para eliminar contactos duplicados o limpiar formatos de números telefónicos directamente en Google Sheets desde la app.
