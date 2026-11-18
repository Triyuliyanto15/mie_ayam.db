// TAB ANTREAN: daftar pesanan hari ini, bayar, selesai, batal.
/* ---------- ANTREAN ---------- */
const FILTERS = [["MENUNGGU", "Menunggu"], ["SELESAI", "Selesai"], ["BATAL", "Batal"], ["SEMUA", "Semua"]];
function renderChips() {
  $("chips").replaceChildren(...FILTERS.map(([k, label]) =>
    h("button", { type: "button", class: "chip" + (orderFilter === k ? " on" : ""), onclick: () => { orderFilter = k; loadOrders(); } }, label)));
}
async function loadOrders() {
  renderChips();
  $("antreanDate").textContent = "Hari ini: " + new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const { data, error } = await db.from("orders")
    .select("id,queue_name,queue_number,customer_name,note,total,payment_status,payment_received,status,created_at,order_items(product_name,unit_price,quantity,subtotal)")
    .eq("order_date", todayWIB()).order("queue_number", { ascending: true });
  if (error) return show("Gagal memuat antrean: " + error.message, "err");
  const live = data.filter((o) => o.status !== "BATAL");
  $("stCount").textContent = live.length;
  $("stWait").textContent = data.filter((o) => o.status === "MENUNGGU").length;
  $("stRev").textContent = rupiah(live.filter((o) => o.payment_status === "LUNAS").reduce((s, o) => s + o.total, 0));
  const list = orderFilter === "SEMUA" ? data : data.filter((o) => o.status === orderFilter);
  $("orders").replaceChildren(...list.map(orderCard));
  $("ordersEmpty").hidden = list.length > 0;
}
function orderCard(o) {
  const paid = o.payment_status === "LUNAS";
  const items = h("ul", {}, (o.order_items || []).map((i) => h("li", {}, i.quantity + "× " + i.product_name + " — " + rupiah(i.subtotal))));
  const card = h("div", { class: "order" + (o.status === "SELESAI" ? " done-o" : "") + (o.status === "BATAL" ? " cancel" : "") },
    h("div", { style: "display:flex;justify-content:space-between;align-items:center" },
      h("span", { class: "q" }, o.queue_name || ("#" + o.id)),
      h("span", { class: "muted" }, dateTimeWIB(o.created_at))),
    o.customer_name ? h("div", {}, "👤 " + o.customer_name) : null,
    items,
    o.note ? h("div", { class: "muted" }, "Catatan: " + o.note) : null,
    h("div", { style: "font-weight:800;margin-top:6px" }, "Total " + rupiah(o.total)),
    h("div", { style: "margin-top:6px" },
      h("span", { class: "tag " + (o.status === "MENUNGGU" ? "wait" : o.status === "SELESAI" ? "on" : "off") }, o.status),
      " ",
      h("span", { class: "tag " + (paid ? "on" : "off") }, paid ? "LUNAS" : "BELUM LUNAS")));
  if (paid) card.append(h("div", { class: "muted" }, "Diterima " + rupiah(o.payment_received) + " · Kembali " + rupiah(Math.max(0, o.payment_received - o.total))));
  if (!paid && o.status !== "BATAL") {
    const inp = h("input", { type: "text", placeholder: "Uang diterima" });
    const chg = h("div", { class: "chg muted" });
    money(inp, () => {
      if (!inp.value) { chg.textContent = ""; return; }
      const v = numOf(inp);
      chg.textContent = v < o.total ? "Kurang " + rupiah(o.total - v) : "Kembalian " + rupiah(v - o.total);
      chg.style.color = v < o.total ? "var(--bad)" : "var(--ok)";
    });
    card.append(h("div", { class: "payrow" }, inp,
      h("button", { class: "btn sm", type: "button", onclick: () => payOrder(o, numOf(inp)) }, "Bayar"),
      h("button", { class: "btn ghost sm", type: "button", onclick: () => payOrder(o, o.total) }, "Pas")), chg);
  }
  if (o.status !== "BATAL") {
    card.append(h("div", { class: "actions" },
      h("button", { class: "btn ghost sm", type: "button", onclick: () => printNota(notaOf(o)) }, "🧾 Nota"),
      o.status === "SELESAI" ? h("button", { class: "btn ghost sm", type: "button", onclick: () => announce(o, true) }, "🔊 Panggil") : null));
  }
  if (o.status === "MENUNGGU") {
    card.append(h("div", { class: "actions" },
      h("button", { class: "btn ok sm", type: "button", onclick: () => setStatus(o, "SELESAI") }, "Selesai"),
      h("button", { class: "btn bad sm", type: "button", onclick: () => { if (confirm("Batalkan pesanan " + o.queue_name + "?")) setStatus(o, "BATAL"); } }, "Batal")));
  }
  return card;
}
async function payOrder(o, received) {
  if (!Number.isInteger(received) || received < o.total) return show("Uang diterima kurang dari total (" + rupiah(o.total) + ").", "err");
  const { error } = await db.from("orders").update({ payment_status: "LUNAS", payment_received: received }).eq("id", o.id);
  if (error) return show("Gagal menyimpan pembayaran: " + error.message, "err");
  show("Lunas. Kembalian: " + rupiah(received - o.total), "ok"); loadOrders();
}
async function setStatus(o, status) {
  const { error } = await db.from("orders").update({ status }).eq("id", o.id);
  if (error) return show("Gagal mengubah status: " + error.message, "err");
  if (status === "SELESAI") announce(o);
  loadOrders();
}
