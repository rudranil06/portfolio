(function () {
  function f(id) { return document.getElementById(id); }
  function fmtCr(r) { return "₹" + (r / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " Cr"; }
  function fmtN(n) { return n.toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

  function calc() {
    var perf = parseFloat(f("i_perf").value) || 0;
    var cpc = parseFloat(f("i_cpc").value) || 1;
    var cr = parseFloat(f("i_cr").value) || 0;
    var aov = parseFloat(f("i_aov").value) || 0;
    var spend = perf * 1e7;
    var visits = spend / cpc;
    var orders = visits * (cr / 100);
    var rev = orders * aov;
    var roas = spend > 0 ? (rev / spend) : 0;
    var cac = orders > 0 ? (35 * 1e7 / orders) : 0;
    f("o_visits").textContent = fmtN(Math.round(visits / 100000)) + " L";
    f("o_orders").textContent = fmtN(Math.round(orders / 1000)) + "k";
    f("o_rev").textContent = fmtCr(rev);
    f("o_roas").textContent = roas.toFixed(1) + "x";
    f("o_cac").textContent = "₹" + fmtN(Math.round(cac));
  }

  function drawFlight() {
    var ch = [
      ["Google Search", [1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 1, 1]],
      ["Instagram / Meta", [0, 0, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1]],
      ["YouTube", [0, 0, 0, 1, 2, 3, 3, 2, 1, 1, 1, 1]],
      ["OTT (JioHotstar / Cinema)", [0, 0, 0, 0, 1, 2, 3, 2, 1, 1, 0, 0]],
      ["Influencers / creators", [0, 0, 0, 1, 1, 3, 3, 1, 1, 0, 1, 0]],
      ["OOH / graffiti / expo", [0, 0, 0, 0, 1, 3, 2, 0, 0, 0, 3, 2]],
      ["Report / PR", [0, 0, 1, 3, 3, 1, 1, 0, 0, 0, 0, 0]],
      ["Parties / events", [0, 0, 0, 0, 0, 1, 3, 2, 1, 0, 0, 0]],
      ["Sessions (chip / Boiler Room)", [0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1]],
      ["Email / CRM", [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1]]
    ];
    var mo = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    var op = [0, 0.22, 0.5, 0.82];
    var h = '<div style="display:grid;grid-template-columns:172px repeat(12,1fr);gap:2px;align-items:center">';
    h += '<div></div>';
    mo.forEach(function (m) { h += '<div style="text-align:center;font-size:10px;color:rgba(240,230,210,0.6)">' + m + '</div>'; });
    ch.forEach(function (r) {
      h += '<div style="font-size:11px;color:#F0E6D2;padding-right:6px;text-align:right;white-space:nowrap">' + r[0] + '</div>';
      r[1].forEach(function (v) {
        var bg = v === 0 ? 'rgba(201,162,75,0.07)' : 'rgba(201,162,75,' + op[v] + ')';
        h += '<div style="height:20px;border-radius:4px;background:' + bg + '"></div>';
      });
    });
    h += '</div>';
    var fl = document.getElementById('flight');
    if (fl) fl.innerHTML = h;
    var lg = document.getElementById('flightleg');
    if (lg) lg.innerHTML = 'Darker = more spend that month. The Sept-Oct column block is the 6-week burst; the festive harvest holds Search, Meta and OTT high through January.';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (f("i_perf")) {
      ["i_perf", "i_cpc", "i_cr", "i_aov"].forEach(function (id) { f(id).addEventListener("input", calc); });
      calc();
    }
    drawFlight();
  });
})();
