(function () {
  var reduced = false;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  function wireInk(scope) {
    (scope || document).querySelectorAll('a,button').forEach(function (el) {
      if (el.dataset.inked) return;
      var hasGrad = false;
      try { hasGrad = /gradient/.test(getComputedStyle(el).backgroundImage); } catch (_) {}
      if (!hasGrad) return;
      el.dataset.inked = '1';

      if (reduced) {
        // prefers-reduced-motion: no ink bloom, instant charcoal fill instead.
        el.style.transition = 'none';
        el.style.background = 'transparent';
        var fill = function () { el.style.background = '#1A1714'; el.style.color = '#FBF8F0'; };
        var clear = function () { el.style.background = 'transparent'; el.style.color = '#1A1714'; };
        el.addEventListener('mouseenter', fill);
        el.addEventListener('mouseleave', clear);
        el.addEventListener('focus', fill);
        el.addEventListener('blur', clear);
        return;
      }

      el.style.position = 'relative';
      el.style.zIndex = '0';
      el.style.overflow = 'hidden';
      el.style.background = 'transparent';
      el.style.transition = 'color .4s ease';

      var ink = document.createElement('span');
      ink.setAttribute('aria-hidden', 'true');
      ink.style.cssText = [
        'position:absolute', 'left:50%', 'top:56%',
        'width:150%', 'height:150%',
        'transform:translate(-50%,-50%) scale(0) rotate(0deg)',
        'transform-origin:50% 50%',
        'background:radial-gradient(circle at 50% 50%,#1A1714 30%,rgba(26,23,20,0.94) 50%,rgba(26,23,20,0.55) 68%,rgba(26,23,20,0.2) 82%,rgba(26,23,20,0) 94%)',
        'border-radius:46% 54% 52% 48% / 52% 46% 54% 48%',
        'filter:url(#inkFill)',
        'transition:transform 1.18s cubic-bezier(.2,.7,.25,1),opacity .35s ease',
        'pointer-events:none', 'z-index:-1', 'opacity:0'
      ].join(';');
      el.appendChild(ink);

      var enter = function () {
        ink.style.opacity = '1';
        ink.style.transform = 'translate(-50%,-50%) scale(1.9) rotate(8deg)';
        el.style.color = '#FBF8F0';
      };
      var leave = function () {
        ink.style.transform = 'translate(-50%,-50%) scale(0) rotate(0deg)';
        el.style.color = '#1A1714';
        clearTimeout(ink._t);
        ink._t = setTimeout(function () {
          if (ink.style.transform.indexOf('scale(0)') > -1) ink.style.opacity = '0';
        }, 380);
      };
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      el.addEventListener('focus', enter);
      el.addEventListener('blur', leave);
    });
  }

  window.__wireInk = wireInk;
  if (document.readyState !== 'loading') wireInk(document);
  else document.addEventListener('DOMContentLoaded', function () { wireInk(document); });
})();
