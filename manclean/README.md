# MANCLEAN Services · Web de cotizaciones

Página estática (GitHub Pages) con formulario de cotización conectado a un flujo de **n8n**.

**Sitio:** https://mloyola99-lang.github.io/centinela-reporte-diario/manclean/

## Flujo
1. El cliente elige un servicio (muebles, colchones, alfombras o sillas) y deja sus datos.
2. La página envía un `POST` JSON al webhook de n8n (`/webhook/manclean-cotizacion`).
3. n8n valida, registra la solicitud en Google Sheets (**BASE DE DATOS CLIENTES MANCLEAN**, hoja `Clientes`),
   envía un promomail de confirmación al cliente y notifica al administrador.

El flujo exportado está en [`n8n/MANCLEAN_agente_cotizaciones.json`](n8n/MANCLEAN_agente_cotizaciones.json)
(importar en n8n → *Import from file* y reasignar credenciales de Google Sheets y Gmail).

## Seguridad básica aplicada
- **Página:** Content-Security-Policy estricta (solo scripts/estilos propios, conexión solo al dominio n8n), sin dependencias externas, `referrer` restringido, sin secretos en el código.
- **Anti-spam:** campo trampa (honeypot), tiempo mínimo de llenado, filtro de bots del webhook y límite de 3 solicitudes por correo y 10 por IP cada hora.
- **Webhook:** CORS limitado a `https://mloyola99-lang.github.io` y verificación de `Origin` en el servidor.
- **Datos:** lista blanca de servicios, validación de formato (correo, teléfono, nombre), límites de longitud y limpieza de caracteres de control.
- **Correos:** todo dato del cliente se escapa antes de insertarse en HTML (evita inyección de HTML/scripts).
- **Hoja:** escritura en modo `RAW` (los valores nunca se evalúan como fórmulas).
- **Privacidad:** casilla de consentimiento obligatoria.
