// main.js — Copiado simple, profesional y accesible (ES)
'use strict';

/* ---------- Utilidades ---------- */
const $ = (s, root = document) => root.querySelector(s);

const REVERT_MS = 1500;     // tiempo para revertir textos de botón
const LONG_PRESS_MS = 550;  // umbral para pulsación larga en móviles

/* ---------- Ayudas de UX ---------- */
const statusNode = $('#status');

function announce(msg) {
  if (!statusNode) return;
  statusNode.textContent = msg;
  clearTimeout(statusNode._t);
  statusNode._t = setTimeout(() => { statusNode.textContent = ''; }, REVERT_MS);
}

function vibrate(pattern) {
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) {} }
}

function selectOnFocus(input) {
  if (!input) return;
  input.addEventListener('focus', () => input.select());
  input.addEventListener('click', () => input.select());
}

/* ---------- Estados de botón (icon-only compatible) ---------- */
function setButtonState(btn, { text, aria, title }) {
  if (!btn) return;
  if (!btn._original) {
    btn._original = {
      text: btn.textContent.trim() || 'Copiar',
      aria: btn.getAttribute('aria-label') || '',
      title: btn.getAttribute('title') || ''
    };
  }
  if (text  != null) btn.textContent = text;
  if (aria  != null) btn.setAttribute('aria-label', aria);
  if (title != null) btn.setAttribute('title', title);
}
function revertButtonState(btn) {
  if (!btn || !btn._original) return;
  btn.textContent = btn._original.text;
  if (btn._original.aria)  btn.setAttribute('aria-label', btn._original.aria);
  if (btn._original.title) btn.setAttribute('title', btn._original.title);
}

/* ---------- Copiado con fallback ---------- */
function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('execCommand failed'));
    } catch (err) { reject(err); }
  });
}

async function handleCopy(btn, text) {
  if (!btn) return;
  clearTimeout(btn._t);
  try {
    await copyWithFallback(text);
    setButtonState(btn, { text: '¡Copiado!', aria: 'Copiado correctamente', title: 'Copiado' });
    announce('¡Copiado!');
    vibrate(20);
  } catch {
    setButtonState(btn, { text: 'Fallo al copiar', aria: 'Fallo al copiar', title: 'Fallo al copiar' });
    announce('Fallo al copiar');
    vibrate([40, 60, 40]);
  } finally {
    btn._t = setTimeout(() => revertButtonState(btn), REVERT_MS);
  }
}

/* ---------- Enlaces de UI ---------- */
function bindCopyPair({ inputId, buttonId }) {
  const input  = $('#'+inputId);
  const button = $('#'+buttonId);
  if (!input || !button) return { input:null, button:null };

  selectOnFocus(input);

  // Click para copiar
  button.addEventListener('click', () => handleCopy(button, input.value));

  // Pulsación larga en el input
  let t = null;
  const start = () => { clearTimeout(t); t = setTimeout(() => handleCopy(button, input.value), LONG_PRESS_MS); };
  const cancel = () => { clearTimeout(t); t = null; };
  input.addEventListener('touchstart', start, { passive: true });
  input.addEventListener('touchend', cancel);
  input.addEventListener('touchcancel', cancel);

  return { input, button };
}

/* ---------- Inicialización ---------- */
(function init() {
  // Pares copiable + botón (incluye BANCO nuevo)
  const { input: bankInput,    button: copyBankBtn    } = bindCopyPair({ inputId: 'bank',    buttonId: 'copy-bank'    });
  const { input: phoneInput,   button: copyPhoneBtn   } = bindCopyPair({ inputId: 'phone',   buttonId: 'copy-phone'   });
  const { input: accountInput, button: copyAccountBtn } = bindCopyPair({ inputId: 'account', buttonId: 'copy-account' });

  // Copiar todo: SOLO valores (Banco + Teléfono + Cuenta)
  const copyBothBtn = $('#copy-both');
  copyBothBtn?.addEventListener('click', () => {
    const bank    = bankInput?.value    ?? '';
    const phone   = phoneInput?.value   ?? '';
    const account = accountInput?.value ?? '';
    const text = [bank, phone, account].filter(Boolean).join('\n');
    handleCopy(copyBothBtn, text);
  });

  // Atajos de teclado: Alt+1 (Teléfono), Alt+2 (Cuenta), Alt+3 (Banco), Alt+A (Todo)
  document.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === '1') { e.preventDefault(); copyPhoneBtn?.click(); }
    else if (k === '2') { e.preventDefault(); copyAccountBtn?.click(); }
    else if (k === '3') { e.preventDefault(); copyBankBtn?.click(); }
    else if (k === 'a') { e.preventDefault(); copyBothBtn?.click(); }
  });
})();

/* ---------- Cambiar fondo (random palettes) ---------- */
(function initThemeSwitcher() {
  const palettes = [
    {
      '--bg-top': '#fdf2f8',   // soft pink
      '--bg-bottom': '#fce7f3',
      '--panel': '#fff',
      '--primary-bg': '#db2777',
      '--primary-bg-hover': '#be185d',
      '--primary-bg-active': '#9d174d',
    },
    {
      '--bg-top': '#eff6ff',   // soft blue
      '--bg-bottom': '#dbeafe',
      '--panel': '#fff',
      '--primary-bg': '#2563eb',
      '--primary-bg-hover': '#1d4ed8',
      '--primary-bg-active': '#1e40af',
    },
    {
      '--bg-top': '#ecfdf5',   // soft green
      '--bg-bottom': '#d1fae5',
      '--panel': '#fff',
      '--primary-bg': '#059669',
      '--primary-bg-hover': '#047857',
      '--primary-bg-active': '#065f46',
    }
  ];

  const btn = document.querySelector('#change-theme');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const choice = palettes[Math.floor(Math.random() * palettes.length)];
    for (const [prop, val] of Object.entries(choice)) {
      document.documentElement.style.setProperty(prop, val);
    }
  });
})();

// Exponer handleCopy si alguna integración externa lo necesita
window.handleCopy = handleCopy;
