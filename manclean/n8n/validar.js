// MANCLEAN · Validación y sanitización de la solicitud (seguridad básica)
const SERVICIOS = ['Limpieza de muebles', 'Limpieza de colchones', 'Limpieza de alfombras', 'Limpieza de sillas'];
const req = $input.first().json;
const b = (req.body && typeof req.body === 'object') ? req.body : {};
const h = req.headers || {};

const fail = (status, error) => [{ json: { valid: false, status, error } }];

// 1) Origen permitido (además del CORS del webhook)
const ORIGENES = ['https://mloyola99-lang.github.io'];
const origin = String(h.origin || '');
if (origin && !ORIGENES.includes(origin)) return fail(403, 'Origen no permitido');

// 2) Anti-bots: honeypot y tiempo mínimo de llenado
if (String(b.website || '').trim() !== '') return fail(400, 'Solicitud inválida');
const t = Number(b.ts || 0);
if (t && Date.now() - t < 3000) return fail(400, 'Solicitud inválida');

// 3) Limpieza: recorta, quita caracteres de control y limita longitud
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const d = {
  servicio: clean(b.servicio, 40),
  nombre: clean(b.nombre, 80),
  correo: clean(b.correo, 120).toLowerCase(),
  telefono: clean(b.telefono, 20),
  distrito: clean(b.distrito, 60),
  mensaje: clean(b.mensaje, 500),
};

// 4) Validación de negocio
if (!SERVICIOS.includes(d.servicio)) return fail(400, 'Selecciona un servicio válido');
if (d.nombre.length < 2 || !/^[\p{L} .'-]+$/u.test(d.nombre)) return fail(400, 'Nombre inválido');
if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.correo)) return fail(400, 'Correo inválido');
if (!/^\+?[0-9 ()-]{7,20}$/.test(d.telefono)) return fail(400, 'Teléfono inválido');
if (b.consentimiento !== true && b.consentimiento !== 'true') return fail(400, 'Debes aceptar el tratamiento de datos');

// 5) Límite de frecuencia: máx. 3 solicitudes por correo y 10 por IP cada hora
const ip = String(h['x-forwarded-for'] || h['x-real-ip'] || '').split(',')[0].trim() || 'sin-ip';
const store = $getWorkflowStaticData('global');
const now = Date.now(), HORA = 3600000;
store.rl = store.rl || {};
for (const k of Object.keys(store.rl)) { store.rl[k] = store.rl[k].filter(x => now - x < HORA); if (!store.rl[k].length) delete store.rl[k]; }
const kc = 'c:' + d.correo, ki = 'i:' + ip;
if ((store.rl[kc] || []).length >= 3 || (store.rl[ki] || []).length >= 10) return fail(429, 'Demasiadas solicitudes, intenta más tarde');
store.rl[kc] = [...(store.rl[kc] || []), now];
store.rl[ki] = [...(store.rl[ki] || []), now];

// 6) Versiones seguras: para HTML (correos) y para hoja (evita inyección de fórmulas)
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cell = s => s; // la hoja se escribe en modo RAW: nunca evalúa fórmulas
const fecha = $now.setZone('America/Lima');
const id = 'MC-' + fecha.toFormat('yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

return [{ json: {
  valid: true, status: 200, id,
  fecha: fecha.toFormat('yyyy-LL-dd HH:mm'),
  ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, cell(v)])),
  correo: d.correo,
  html: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, esc(v || '-')])),
  primerNombre: esc(d.nombre.split(' ')[0]),
  origen: origin || 'directo',
} }];
