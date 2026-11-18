// TAB LAPORAN: laporan bulanan, grafik per hari, rekap per menu.
/* ---------- LAPORAN BULANAN ---------- */
const short = (n) => n >= 1e6 ? (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt" : n >= 1e3 ? Math.round(n / 1e3) + "rb" : String(Math.round(n));
function drawChart(days, axis, tip) {
  const W = 720, H = 240, L = 40, B = 22, T = 10, R = 6, pw = W - L - R, ph = H - T - B;
  const max = Math.max(...days.map((x) => x.v), 1), bw = pw / days.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Grafik per hari">`;
  for (let i = 0; i <= 4; i++) {
    const y = T + ph - ph * i / 4;
    s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L - 4}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--muted)">${axis(max * i / 4)}</text>`;
  }
  days.forEach((x, i) => {
    const bh = ph * x.v / max, bx = L + i * bw;
    s += `<rect x="${bx + 1}" y="${T + ph - bh}" width="${Math.max(bw - 2, 1)}" height="${bh}" rx="2" fill="var(--brand)"><title>Tgl ${x.d}: ${tip(x)}</title></rect>`;
    s += `<text x="${bx + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--muted)">${x.d}</text>`;
  });
  return s + "</svg>";
}
const nf = (n) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: 1 });
async function loadReport() {
  const ym = $("rmonth").value || todayWIB().slice(0, 7);
  $("rmonth").value = ym;
  const [y, m] = ym.split("-").map(Number), nd = new Date(y, m, 0).getDate();
  const from = ym + "-01", to = ym + "-" + String(nd).padStart(2, "0");
  let all = [], start = 0;
  for (;;) {
    const { data, error } = await db.from("orders").select("order_date,total,payment_status,status,order_items(product_name,quantity,subtotal)")
      .gte("order_date", from).lte("order_date", to).order("order_date").order("id").range(start, start + 999);
    if (error) return show("Gagal memuat laporan: " + error.message, "err");
    all = all.concat(data);
    if (data.length < 1000) break;
    start += 1000;
  }
  const days = Array.from({ length: nd }, (_, i) => ({ d: i + 1, n: 0, rev: 0, it: new Map() }));
  const tot = new Map();
  for (const o of all) {
    if (o.status === "BATAL") continue;
    const x = days[parseInt(o.order_date.slice(8, 10), 10) - 1];
    if (!x) continue;
    const lunas = o.payment_status === "LUNAS";
    x.n++;
    if (lunas) x.rev += o.total;
    const seen = new Set();
    for (const i of o.order_items || []) {
      for (const mp of [x.it, tot]) {
        const r = mp.get(i.product_name) || { q: 0, rev: 0, o: 0 };
        r.q += i.quantity;
        if (lunas) r.rev += i.subtotal;
        if (!seen.has(i.product_name)) r.o++;
        mp.set(i.product_name, r);
      }
      seen.add(i.product_name);
    }
  }
  // pilihan menu
  const names = [...tot.keys()].sort((a, b) => a.localeCompare(b, "id"));
  const sel = $("rprod"), cur = sel.value;
  sel.replaceChildren(h("option", { value: "" }, "Semua menu"), ...names.map((n) => h("option", { value: n }, n)));
  sel.value = names.includes(cur) ? cur : "";
  const p = sel.value;
  for (const x of days) {
    const r = p ? x.it.get(p) : null;
    x.v = p ? (r ? r.q : 0) : x.rev;
    x.pr = p ? (r ? r.rev : 0) : x.rev;
    x.pn = p ? (r ? r.o : 0) : x.n;
  }
  const act = days.filter((x) => x.pn > 0);
  const sumV = days.reduce((s, x) => s + x.v, 0), sumRev = days.reduce((s, x) => s + x.pr, 0), sumN = days.reduce((s, x) => s + x.pn, 0);
  const best = days.reduce((a, b) => (b.v > a.v ? b : a), days[0]);
  const bulan = new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const totalQty = [...tot.values()].reduce((s, r) => s + r.q, 0);

  $("rL1").textContent = p ? "Omzet " + p + " (lunas)" : "Omzet (lunas)";
  $("rRev").textContent = rupiah(sumRev);
  $("rL2").textContent = p ? p + " terjual (porsi)" : "Jumlah pesanan";
  $("rCount").textContent = nf(p ? sumV : sumN);
  $("rAvg").textContent = p ? (act.length ? nf(sumV / act.length) + " porsi" : "-") : rupiah(act.length ? Math.round(sumRev / act.length) : 0);
  $("rBest").textContent = best.v > 0 ? "Tgl " + best.d + " · " + (p ? nf(best.v) + " porsi" : rupiah(best.v)) : "-";
  $("chartTitle").textContent = (p ? p + " terjual per hari (porsi)" : "Omzet per hari") + " — " + bulan;
  $("chart").innerHTML = drawChart(days, p ? (v) => String(Math.round(v)) : short,
    p ? (x) => nf(x.v) + " porsi" : (x) => rupiah(x.rev) + " (" + x.n + " pesanan)");

  // total per menu
  const prods = [...tot.entries()].sort((a, b) => b[1].q - a[1].q);
  $("rpRows").replaceChildren(...prods.map(([n, r]) => h("tr", { style: n === p ? "font-weight:800" : null }, h("td", {}, n), h("td", {}, nf(r.q) + " porsi"), h("td", {}, rupiah(r.rev)))));
  $("rpFoot").replaceChildren(...(prods.length ? [h("tr", {}, h("td", {}, "Total"), h("td", {}, nf(totalQty) + " porsi"), h("td", {}, rupiah(prods.reduce((s, [, r]) => s + r.rev, 0))))] : []));

  // rincian per hari
  const wrap = { style: "white-space:normal;min-width:240px" };
  $("rRows").replaceChildren(...act.map((x) => h("tr", {},
    h("td", {}, x.d + " " + bulan), h("td", {}, x.pn),
    h("td", wrap, p ? nf(x.v) + "× " + p : [...x.it].sort((a, b) => b[1].q - a[1].q).map(([n, r]) => r.q + "× " + n).join(", ")),
    h("td", {}, rupiah(x.pr)))));
  $("rFoot").replaceChildren(...(act.length ? [h("tr", {}, h("td", {}, "Total"), h("td", {}, nf(sumN)), h("td", wrap, nf(p ? sumV : totalQty) + " porsi"), h("td", {}, rupiah(sumRev)))] : []));
  $("rEmpty").hidden = act.length > 0;
}
$("rmonth").onchange = loadReport;
$("rprod").onchange = loadReport;
