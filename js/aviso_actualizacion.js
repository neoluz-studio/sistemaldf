/* Lo de Fausti — Aviso de actualización (sin dependencias)
   IMPORTANTE: cambiar VERSION_AVISO cuando se publique otra actualización.
   El aviso se muestra una vez por navegador/perfil al cerrar con Entendido.
*/
(() => {
  'use strict';
  const VERSION_AVISO = 'ldf-2026-10-27';
  const CLAVE = 'ldf-aviso-visto-' + VERSION_AVISO;
  const puedeGuardar = (() => {
    try { return window.localStorage.getItem(CLAVE) !== '1'; }
    catch (_) { return true; }
  })();
  if (!puedeGuardar) return;

  const iniciar = () => {
    if (document.getElementById('ldf-aviso-actualizacion')) return;
    const estilo = document.createElement('style');
    estilo.textContent = `
      #ldf-aviso-actualizacion{position:fixed;inset:0;z-index:2147483000;background:rgba(9,17,31,.45);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;}
      #ldf-aviso-actualizacion .ldf-aviso-card{width:min(430px,100%);box-sizing:border-box;background:#16253d;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:25px;box-shadow:0 25px 65px rgba(0,0,0,.3);animation:ldf-entrar .3s ease-out;}
      #ldf-aviso-actualizacion .ldf-aviso-superior{display:flex;gap:13px;align-items:center;margin-bottom:15px;}
      #ldf-aviso-actualizacion .ldf-aviso-icono{display:grid;place-items:center;width:47px;height:47px;flex-shrink:0;border-radius:15px;background:#29466b;font-size:23px;}
      #ldf-aviso-actualizacion h2{font-size:20px;line-height:1.25;margin:0 0 4px;font-weight:720;color:#fff;}
      #ldf-aviso-actualizacion .ldf-aviso-etiqueta{font-size:12px;color:#a9bfdc;margin:0;}
      #ldf-aviso-actualizacion .ldf-aviso-mensaje{font-size:14px;line-height:1.6;color:#e3ebf7;margin:0 0 21px;}
      #ldf-aviso-actualizacion button{display:block;width:100%;min-height:45px;padding:10px 16px;border:0;border-radius:12px;background:#4279bd;color:#fff;font:650 14px Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;cursor:pointer;}
      #ldf-aviso-actualizacion button:hover{background:#528bd1;}
      #ldf-aviso-actualizacion button:focus-visible{outline:3px solid #abd5ff;outline-offset:3px;}
      @keyframes ldf-entrar{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(prefers-reduced-motion:reduce){#ldf-aviso-actualizacion .ldf-aviso-card{animation:none;}}
    `;
    document.head.appendChild(estilo);
    const fondo = document.createElement('div');
    fondo.id = 'ldf-aviso-actualizacion';
    fondo.setAttribute('role','presentation');
    const tarjeta = document.createElement('section');
    tarjeta.className = 'ldf-aviso-card';
    tarjeta.setAttribute('role','dialog');
    tarjeta.setAttribute('aria-modal','true');
    tarjeta.setAttribute('aria-labelledby','ldf-aviso-titulo');
    tarjeta.innerHTML = `<div class="ldf-aviso-superior"><div class="ldf-aviso-icono" aria-hidden="true">✨</div><div><h2 id="ldf-aviso-titulo">¡Lo de Fausti se actualizó!</h2><p class="ldf-aviso-etiqueta">Mejoras disponibles</p></div></div><p class="ldf-aviso-mensaje">Mejoramos el buscador de productos, los informes y la presentación de las pantallas para que trabajar con el sistema sea más cómodo.</p><button type="button" id="ldf-aviso-cerrar">¡Entendido!</button>`;
    fondo.appendChild(tarjeta);
    document.body.appendChild(fondo);
    const btn = tarjeta.querySelector('#ldf-aviso-cerrar');
    btn.addEventListener('click', () => {
      try { window.localStorage.setItem(CLAVE, '1'); } catch (_) {}
      fondo.remove();
      estilo.remove();
    });
    btn.focus();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
  else iniciar();
})();
