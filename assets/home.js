(function () {
  var reduced = false;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
  var headerH = 66;

  function scrollToSec(target) {
    var el = document.querySelector('[data-sec="' + target + '"]');
    if (!el) return;
    var scroller = document.scrollingElement || document.documentElement;
    var dest = Math.max(0, Math.min(el.offsetTop - headerH, scroller.scrollHeight - scroller.clientHeight));
    if (reduced) { scroller.scrollTop = dest; return; }
    var start = scroller.scrollTop, diff = dest - start;
    if (Math.abs(diff) < 1) return;
    var dur = 520, t0 = null;
    function step(ts) {
      if (t0 == null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = start + diff * e;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('mobileNav');
    document.querySelectorAll('[data-target]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = a.getAttribute('data-target');
        if (nav) nav.style.display = 'none';
        requestAnimationFrame(function () { scrollToSec(t); });
      });
    });
    var toggle = document.getElementById('navToggle');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.style.display && nav.style.display !== 'none';
        nav.style.display = open ? 'none' : 'flex';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
  });
})();
