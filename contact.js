document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  const charCountEl = document.getElementById('charCount');
  const msgArea = document.getElementById('mensaje');
  const formMessages = document.getElementById('form-messages');

  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfInput = document.getElementById('csrf_token');
  if (csrfMeta && csrfInput) csrfInput.value = csrfMeta.content;

  if (msgArea && charCountEl) {
    msgArea.addEventListener('input', function () {
      charCountEl.textContent = this.value.length;
    });
  }

  const RATE_KEY = 'contact_attempts';
  const RATE_WINDOW = 3600000;
  const MAX_ATTEMPTS = 3;

  function checkRateLimit() {
    const data = JSON.parse(localStorage.getItem(RATE_KEY) || '{"attempts":0,"firstAttempt":0}');
    const now = Date.now();
    if (now - data.firstAttempt > RATE_WINDOW) {
      localStorage.setItem(RATE_KEY, JSON.stringify({ attempts: 1, firstAttempt: now }));
      return true;
    }
    if (data.attempts >= MAX_ATTEMPTS) return false;
    data.attempts++;
    localStorage.setItem(RATE_KEY, JSON.stringify(data));
    return true;
  }

  function showMessage(type, text) {
    if (!formMessages) return;
    formMessages.className = 'form-messages ' + type;
    formMessages.textContent = text;
    formMessages.style.display = 'block';
    formMessages.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const hp = document.getElementById('website');
      if (hp && hp.value) return;

      if (!checkRateLimit()) {
        showMessage('error', 'Has enviado demasiados mensajes. Por favor espera antes de volver a intentarlo.');
        return;
      }

      const nombre = sanitize(document.getElementById('nombre')?.value || '');
      const email = document.getElementById('email')?.value || '';
      const telefono = sanitize(document.getElementById('telefono')?.value || '');
      const servicio = sanitize(document.getElementById('servicio')?.value || '');
      const mensaje = sanitize(document.getElementById('mensaje')?.value || '');
      const privacidad = document.querySelector('input[name="privacidad"]')?.checked;

      if (!nombre || !email || !telefono || !servicio || !mensaje) {
        showMessage('error', 'Por favor rellena todos los campos obligatorios.');
        return;
      }
      if (!privacidad) {
        showMessage('error', 'Debes aceptar la política de privacidad para continuar.');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const btnText = btn?.querySelector('.btn-text');
      const btnLoading = btn?.querySelector('.btn-loading');

      if (btn) btn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';

      const formData = new FormData(form);

      fetch(form.action, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showMessage('success', '✓ Mensaje enviado correctamente. Te contactaremos en breve.');
            form.reset();
            if (charCountEl) charCountEl.textContent = '0';
          } else {
            showMessage('error', data.message || 'Error al enviar el mensaje. Inténtalo de nuevo.');
          }
        })
        .catch(() => {
          showMessage('error', 'Error de conexión. Por favor inténtalo de nuevo o contáctanos por teléfono.');
        })
        .finally(() => {
          if (btn) btn.disabled = false;
          if (btnText) btnText.style.display = 'inline';
          if (btnLoading) btnLoading.style.display = 'none';
        });
    });
  }
});
