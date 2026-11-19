// NOTA pemesanan yang bisa dicetak (isi nota diatur di fungsi printNota).
/* ---------- NOTA (CETAK) ---------- */
let lastNota = null;
const nf2 = (n) => Number(n || 0).toLocaleString("id-ID");
const notaOf = (o) => ({
  queue: o.queue_name || ("#" + o.id), customer: o.customer_name || "", note: o.note || "", when: dateTimeWIB(o.created_at),
  items: (o.order_items || []).map((i) => ({ name: i.product_name + (i.modifier_text ? " (" + i.modifier_text + ")" : ""), qty: i.quantity, price: i.unit_price, sub: i.subtotal })),
  type: o.order_type, method: o.payment_method, total: o.total, paid: o.payment_status === "LUNAS" ? o.payment_received : null });
function printNota(n) {
  const line = (a, b, cls) => h("div", { class: "rl" + (cls ? " " + cls : "") }, h("span", {}, a), h("span", {}, b));
  $("receipt").replaceChildren(
    h("div", { class: "rc" }, h("div", { class: "rt" }, "MIE AYAM SUKA RASA"), h("div", {}, "Nota Pemesanan")),
    h("hr"),
    line("No. Antrean", n.queue, "b"),
    line("Waktu", n.when),
    n.type ? line("Tipe", TYPE_LABEL[n.type] || n.type) : null,
    n.customer ? line("Nama", n.customer) : null,
    h("hr"),
    ...n.items.map((i) => h("div", {}, h("div", {}, i.name), line(i.qty + " x " + nf2(i.price), nf2(i.sub)))),
    h("hr"),
    line("TOTAL", "Rp " + nf2(n.total), "b"),
    n.method ? line("Bayar", n.method) : null,
    n.paid != null ? line("Diterima", "Rp " + nf2(n.paid)) : null,
    n.paid != null ? line("Kembali", "Rp " + nf2(Math.max(0, n.paid - n.total))) : null,
    h("div", { class: "rc b", style: "margin-top:4px" }, n.paid != null ? "LUNAS" : "BELUM LUNAS"),
    n.note ? h("div", {}, "Catatan: " + n.note) : null,
    h("hr"),
    h("div", { class: "rc" }, "Terima kasih atas kunjungan Anda"));
  setTimeout(() => window.print(), 50);
}
$("btnPrint").onclick = () => { if (lastNota) printNota(lastNota); };
