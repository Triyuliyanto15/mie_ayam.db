// TAB TUTUP KASIR: buka kasir (kas awal), lihat total per metode, hitung uang laci, lihat selisih.
const sign = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + rupiah(Math.abs(n));
const diffText = (d) => d === 0 ? "Pas ✓" : d > 0 ? "Lebih " + rupiah(d) : "Kurang " + rupiah(-d);
function row(a, b, bold) { return h("div", { class: "total sub", style: bold ? "font-weight:800" : "" }, h("span", {}, a), h("span", {}, b)); }
async function loadShift() {
  const box = $("shiftBox");
  const { data: s, error } = await db.rpc("shift_current");
  if (error) return show("Gagal memuat kasir: " + error.message, "err");
  if (!s) {
    const inp = h("input", { placeholder: "mis. 200.000" }); money(inp);
    return box.replaceChildren(h("h2", {}, "Buka Kasir"), h("p", { class: "muted" }, "Hitung uang tunai di laci sebelum mulai berjualan."),
      h("label", {}, "Kas awal (uang di laci)"), inp,
      h("div", { class: "actions" }, h("button", { class: "btn ok", type: "button", onclick: async () => {
        const { error: e } = await db.rpc("shift_open", { p_opening_cash: numOf(inp) });
        if (e) return show(e.message, "err"); show("Kasir dibuka.", "ok"); loadShift(); } }, "Buka Kasir")));
  }
  const cnt = h("input", { placeholder: "Hitung uang tunai di laci" }), note = h("input", { placeholder: "Catatan (opsional)", maxlength: 120 });
  const diff = h("div", { class: "total" }, h("span", {}, "Selisih"), h("span", {}, "-"));
  money(cnt, () => { const v = diff.lastChild; if (!cnt.value) { v.textContent = "-"; v.style.color = ""; return; }
    const d = numOf(cnt) - s.expected_cash; v.textContent = diffText(d); v.style.color = d === 0 ? "var(--ok)" : "var(--bad)"; });
  box.replaceChildren(h("h2", {}, "Tutup Kasir"),
    h("p", { class: "muted" }, "Dibuka " + dateTimeWIB(s.opened_at) + " WIB"),
    row("Kas awal", rupiah(s.opening_cash)), row("Penjualan tunai", rupiah(s.cash_sales)),
    row("Penjualan QRIS", rupiah(s.qris_sales)), row("Penjualan Transfer", rupiah(s.transfer_sales)),
    row("Jumlah pesanan lunas", s.orders), row("Uang tunai seharusnya di laci", rupiah(s.expected_cash), true),
    s.unpaid > 0 ? h("div", { class: "msg err" }, s.unpaid + " pesanan hari ini belum lunas. Selesaikan dulu di tab Antrean agar total benar.") : null,
    h("label", {}, "Uang tunai di laci (hasil hitung)"), cnt, diff, h("label", {}, "Catatan"), note,
    h("div", { class: "actions" }, h("button", { class: "btn bad", type: "button", onclick: async () => {
      if (!cnt.value) return show("Isi dulu uang tunai di laci.", "err");
      if (!confirm("Tutup kasir sekarang? Selisih: " + diffText(numOf(cnt) - s.expected_cash))) return;
      const { data: r, error: e } = await db.rpc("shift_close", { p_counted_cash: numOf(cnt), p_note: note.value });
      if (e) return show(e.message, "err");
      box.replaceChildren(h("h2", {}, "Kasir Ditutup ✓"), row("Seharusnya di laci", rupiah(r.expected_cash)), row("Uang di laci", rupiah(r.counted_cash)),
        row("Selisih", diffText(r.difference), true), row("Tunai / QRIS / Transfer", rupiah(r.cash_sales) + " / " + rupiah(r.qris_sales) + " / " + rupiah(r.transfer_sales)),
        h("div", { class: "actions" }, h("button", { class: "btn", type: "button", onclick: loadShift }, "Buka kasir baru"), h("button", { class: "btn ghost", type: "button", onclick: () => window.print() }, "Cetak")));
    } }, "Tutup Kasir")));
}
