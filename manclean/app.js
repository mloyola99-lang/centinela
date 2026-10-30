(function () {
  'use strict';
  var WEBHOOK = 'https://mloyola99.app.n8n.cloud/webhook/manclean-cotizacion';
  var form = document.getElementById('form');
  var estado = document.getElementById('estado');
  var enviar = document.getElementById('enviar');
  var cargado = Date.now();

  function irAlFormulario(servicio) {
    if (servicio) {
      var r = form.querySelector('input[name="servicio"][value="' + servicio + '"]');
      if (r) r.checked = true;
    }
    document.getElementById('cotizar').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { form.querySelector('input[name="nombre"]').focus({ preventScroll: true }); }, 450);
  }
  document.getElementById('abrir-cotizacion').addEventListener('click', function () { irAlFormulario(); });
  Array.prototype.forEach.call(document.querySelectorAll('.card'), function (c) {
    c.addEventListener('click', function () { irAlFormulario(c.getAttribute('data-servicio')); });
  });

  function mostrar(msg, err) { estado.textContent = msg; estado.className = 'estado' + (err ? ' err' : ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
    if (!form.checkValidity()) {
      var inv = form.querySelector(':invalid');
      if (inv) { inv.setAttribute('aria-invalid', 'true'); inv.focus(); }
      mostrar(!form.servicio.value ? 'Selecciona un servicio.' : 'Revisa los campos marcados.', true);
      return;
    }
    var datos = {
      servicio: form.servicio.value,
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim(),
      telefono: form.telefono.value.trim(),
      distrito: form.distrito.value.trim(),
      mensaje: form.mensaje.value.trim(),
      consentimiento: form.consentimiento.checked,
      website: form.website.value,
      ts: cargado
    };
    enviar.disabled = true; enviar.textContent = 'Enviando…'; mostrar('');
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 20000);
    fetch(WEBHOOK, {
      method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'strict-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos), signal: ctrl.signal
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (res.ok && res.j.ok) {
        document.getElementById('ok-id').textContent = String(res.j.id || '');
        form.hidden = true;
        var ok = document.getElementById('ok'); ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        mostrar(res.j.error ? String(res.j.error) : 'No pudimos enviar tu solicitud. Intenta nuevamente.', true);
      }
    }).catch(function () {
      mostrar('Problema de conexión. Intenta nuevamente en unos segundos.', true);
    }).finally(function () {
      clearTimeout(timer); enviar.disabled = false; enviar.textContent = 'Solicitar cotización';
    });
  });
})();
