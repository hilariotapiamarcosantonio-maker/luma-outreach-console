# 45 - Luma Outreach Replication Playbook

**Fecha:** 2026-05-23  
**Versión:** 1.0.0  
**Objetivo:** Guía paso a paso para clonar, configurar y desplegar el sistema Luma Outreach Console para nuevos clientes, proyectos o nichos de mercado de forma aislada y segura.

---

## 1. Introducción y Arquitectura Multicliente

El sistema Luma Outreach Console está diseñado bajo una arquitectura de acoplamiento flexible. La lógica del frontend y la API son genéricas, mientras que la configuración y el almacenamiento de datos están delegados a una hoja de cálculo de Google Sheets específica mediante variables de entorno. 

Para replicar este proyecto para otro cliente o nicho, **nunca** se debe compartir la misma base de datos ni las mismas credenciales de Service Account en producción. Cada instancia debe estar completamente aislada.

```
[Cliente A - Vercel App] ──> GOOGLE_SHEET_ID_A ──> [Google Sheet A (Privada)]
[Cliente B - Vercel App] ──> GOOGLE_SHEET_ID_B ──> [Google Sheet B (Privada)]
```

---

## 2. Creación y Estructura de una Nueva Google Sheet

Para iniciar la replicación de datos, sigue este procedimiento:

1. **Crear Hoja a partir de la Plantilla**:
   * Duplica la Google Sheet master de Luma Outreach (Spreadsheet ID de referencia: `1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40`).
   * Renombra el archivo en tu Google Drive siguiendo la nomenclatura del nuevo cliente: `Luma Outreach - [Nombre del Cliente]`.
2. **Verificación de Pestañas Obligatorias**:
   Asegúrate de que la nueva hoja contenga como mínimo las siguientes pestañas con sus respectivos encabezados:
   * `Prospectos`: Hoja operativa donde se listan los prospectos que se trabajarán diariamente. Debe incluir las columnas operativas y las columnas con prefijo `_` en la fila superior (rango `A5:AX5` de la plantilla original).
   * `Prospectos_Master`: Repositorio completo de leads calificados históricos.
   * `Daily_Batches`: Bitácora donde la consola registra los lotes diarios creados.
   * `Proposals`: Registro automático de las propuestas enviadas.
   * `Config_Nichos`: Tabla de constantes para las reglas de productos, ofertas y mensajes recomendados por industria.
3. **Obtener el ID del Documento**:
   * Copia el identificador único de la URL de tu hoja de cálculo.
   * URL de ejemplo: `https://docs.google.com/spreadsheets/d/1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40/edit`  
     *El ID es:* `1VPciipqxvtenN_kS_MbX8iZ-xZXEEaHiuU9uu7Ql-40`

---

## 3. Conexión de la Cuenta de Servicio (Service Account)

La aplicación utiliza la API de Google Sheets y Google Drive a nivel de servidor. Para autorizar el acceso de lectura y escritura:

1. **Crear Credenciales en Google Cloud Console**:
   * Ve a [Google Cloud Console](https://console.cloud.google.com/).
   * Crea un nuevo proyecto o selecciona uno existente.
   * Dirígete a **IAM y administración** > **Cuentas de servicio**.
   * Haz clic en **Crear cuenta de servicio**, asígnale un nombre (ej. `luma-outreach-writer@[project-id].iam.gserviceaccount.com`) y el rol de Editor.
2. **Generar Llave Privada en Formato JSON**:
   * Entra a la cuenta de servicio creada, ve a la pestaña **Claves** y selecciona **Agregar clave** > **Crear clave nueva (JSON)**.
   * Descarga el archivo JSON de forma segura. Contiene las variables críticas:
     * `"client_email"` (Ej: `luma-outreach-writer@...`)
     * `"private_key"` (Llave criptográfica que comienza con `-----BEGIN PRIVATE KEY-----`)
3. **Compartir Acceso en Google Sheets (Paso Crítico)**:
   * Abre la nueva Google Sheet en el navegador.
   * Haz clic en el botón **Compartir** (esquina superior derecha).
   * Pega la dirección de correo electrónico de tu cuenta de servicio (`client_email`).
   * Configúrala con permisos de **Editor** y desmarca la opción de enviar notificación. Haz clic en **Compartir**.

---

## 4. Configuración de Variables de Entorno

### Configuración Local (`.env.local`)
Crea un archivo `.env.local` en la raíz del proyecto replicado. **Este archivo está listado en `.gitignore` y jamás debe ser subido al repositorio**.

```env
# Identificador de la Google Sheet dedicada
GOOGLE_SHEET_ID=tu_nuevo_sheet_id_aqui

# Credenciales de la Service Account
GOOGLE_CLIENT_EMAIL=tu-service-account-email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTuLlavePrivadaConSaltosDeLinea\n-----END PRIVATE KEY-----\n"

# Configuración de Pestañas
GOOGLE_SHEET_TAB_PROSPECTOS=Prospectos
GOOGLE_SHEET_TAB_MASTER=Prospectos_Master

# URL base del Luma Intelligence Hub
LUMA_HUB_BASE_URL=https://luma-intelligence-hub.vercel.app
```

> [!IMPORTANT]
> La variable `GOOGLE_PRIVATE_KEY` en entornos de producción debe configurarse incluyendo las comillas dobles y preservando los saltos de línea codificados como `\n` para que el módulo de autenticación de Node.js la interprete de forma válida.

---

## 5. Qué Archivos Modificar en el Código (Si aplica)

Aunque el sistema es dinámico, existen ciertos archivos que contienen configuraciones por defecto del workspace que querrás adecuar para el nuevo cliente:

1. **Catálogo de Productos y Nichos**:
   * Archivo: [LumaOutreachConsole.tsx](file:///g:/Sistema%20de%20Prospectar%20Marcos%20Hilario/Macro%20Envio%20Masivo%20Whatsapp/src/components/LumaOutreachConsole.tsx)
   * Revisa la constante o base de datos local que asocia los nombres de los nichos comerciales con las pestañas de sheets. Si el nuevo cliente atiende industrias diferentes (ej. "SaaS", "Clínicas Médicas"), debes modificar las pestañas y los filtros correspondientes en la interfaz de usuario.
2. **Slug del Workspace Seguro**:
   * Las rutas del panel están parametrizadas bajo `/console/[workspaceSlug]`.
   * Asegúrate de que los enlaces por defecto (ej. en el menú o redirecciones) apunten al slug asignado al nuevo cliente (ej. `/console/cliente-fitness` en lugar de `/console/luma-premium`).

---

## 6. Despliegue en Vercel (Hosting en Producción)

Para desplegar la nueva instancia utilizando Vercel CLI de forma independiente:

1. **Crear un nuevo Proyecto en Vercel**:
   * Abre la terminal en el directorio del proyecto clonado y ejecuta:
     ```bash
     vercel project add
     ```
   * Sigue las instrucciones para darle un nombre único a la aplicación en Vercel (ej. `luma-outreach-cliente-b`).
2. **Inyectar las Variables de Entorno en Vercel**:
   * Ve al panel de control de Vercel > Selecciona el nuevo proyecto > **Settings** > **Environment Variables**.
   * Registra individualmente las variables de entorno detalladas en el punto 4.
3. **Ejecutar Despliegue de Producción**:
   * Ejecuta el despliegue directo desde tu consola:
     ```bash
     vercel --prod
     ```

---

## 7. Qué NUNCA Copiar y Cómo Evitar Mezclas de Datos

Para proteger la privacidad de los contactos y evitar errores graves de operación:

* **NUNCA utilices un repositorio con datos reales pre-cargados**: El repositorio git de la aplicación debe contener únicamente el código fuente y las plantillas limpias de datos. Elimina cualquier archivo de caché local `.next/` o registros en `localStorage` antes de re-distribuir el código.
* **Prohibido Compartir Service Accounts**: Si la cuenta de servicio del "Cliente A" tiene acceso de Editor a las carpetas del "Cliente B", un error en la configuración de la variable `GOOGLE_SHEET_ID` podría sobrescribir por completo la base de datos comercial del cliente equivocado. **Genera siempre una Service Account única por cada cliente**.
* **Validación de URLs de Reportes**: El campo `_reporte_luma` de Google Sheets apunta a análisis comerciales específicos en Luma Hub. Asegúrate de actualizar los slugs de destino para que los operadores no lean reportes de prospectos de otros clientes.
* **Caché del Navegador**: Al cambiar de entorno de desarrollo local entre proyectos de diferentes clientes, limpia el `localStorage` del navegador para evitar que los parches pendientes de sincronización de un cliente se envíen a la Google Sheet de otro.
