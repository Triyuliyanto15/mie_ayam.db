// TAB KASIR: keranjang, uang diterima, kembalian, simpan pesanan.
/* ---------- KASIR ---------- */
async function loadPos() {
  products = await fetchActive();
  $("posGrid").replaceChildren(...products.map((p) => productCard(p, () => addToCart(p))));
  $("posEmpty").hidden = products.length > 0;
  renderCart();
}
function addToCart(p) {
  const line = cart.get(p.id);
  if (line) line.qty = Math.min(99, line.qty + 1); else cart.set(p.id, { p, qty: 1 });
  renderCart();
}
function calcChange() {
  const el = $("cChange"), has = $("cpaid").value !== "", paid = numOf($("cpaid"));
  if (!has) { el.textContent = "-"; el.style.color = ""; }
  else if (paid < cartTotal) { el.textContent = "Kurang " + rupiah(cartTotal - paid); el.style.color = "var(--bad)"; }
  else { el.textContent = rupiah(paid - cartTotal); el.style.color = "var(--ok)"; }
  $("btnOrder").disabled = cart.size === 0 || (has && paid < cartTotal);
}
function renderCart() {
  const box = $("cart"); box.replaceChildren();
  let total = 0;
  for (const [id, { p, qty }] of cart) {
    total += p.price * qty;
    box.append(h("div", { class: "cartline" },
      h("div", {}, h("div", {}, p.name), h("div", { class: "muted" }, rupiah(p.price) + " × " + qty + " = " + rupiah(p.price * qty))),
      h("div", { class: "qty" },
        h("button", { type: "button", onclick: () => { const l = cart.get(id); l.qty--; if (l.qty < 1) cart.delete(id); renderCart(); } }, "−"),
        h("b", {}, qty),
        h("button", { type: "button", onclick: () => { const l = cart.get(id); l.qty = Math.min(99, l.qty + 1); renderCart(); } }, "+")),
      h("button", { class: "btn bad sm", type: "button", onclick: () => { cart.delete(id); renderCart(); } }, "✕")));
  }
  cartTotal = total;
  $("cartEmpty").hidden = cart.size > 0;
  $("cartTotal").textContent = rupiah(total);
  calcChange();
}
money($("cpaid"), calcChange);
$("quick").replaceChildren(
  h("button", { class: "btn ghost sm", type: "button", onclick: () => { $("cpaid").value = cartTotal ? cartTotal.toLocaleString("id-ID") : ""; calcChange(); } }, "Uang pas"),
  ...[20000, 50000, 100000].map((n) => h("button", { class: "btn ghost sm", type: "button", onclick: () => { $("cpaid").value = n.toLocaleString("id-ID"); calcChange(); } }, n.toLocaleString("id-ID"))));
$("btnClear").onclick = () => { cart.clear(); $("cpaid").value = ""; renderCart(); };
$("btnNext").onclick = () => $("doneBox").classList.add("hide");
$("btnOrder").onclick = async () => {
  if (cart.size === 0) return;
  const paid = $("cpaid").value !== "" ? numOf($("cpaid")) : 0;
  if (paid && paid < cartTotal) return show("Uang diterima kurang dari total (" + rupiah(cartTotal) + ").", "err");
  const btn = $("btnOrder"); btn.disabled = true;
  const items = [...cart.values()].map((l) => ({ product_id: l.p.id, qty: l.qty }));
  const { data, error } = await db.rpc("create_order", { p_items: items, p_customer: $("cname").value, p_note: $("cnote").value });
  if (error) { show("Gagal menyimpan pesanan: " + error.message, "err"); btn.disabled = false; return; }
  const lines = [...cart.values()].map((l) => l.qty + "× " + l.p.name).join(", ");
  let payInfo = "";
  if (paid) {
    let q = db.from("orders").update({ payment_status: "LUNAS", payment_received: paid });
    q = data.id ? q.eq("id", data.id) : q.eq("queue_name", data.queue_name).eq("order_date", todayWIB());
    const { error: e2 } = await q;
    payInfo = e2 ? " — Pembayaran belum tersimpan, catat lewat tab Antrean."
                 : " — Diterima " + rupiah(paid) + ", Kembalian " + rupiah(paid - data.total);
  }
  lastNota = { queue: data.queue_name, customer: $("cname").value.trim(), note: $("cnote").value.trim(), when: dateTimeWIB(new Date().toISOString()),
    items: [...cart.values()].map((l) => ({ name: l.p.name, qty: l.qty, price: l.p.price, sub: l.p.price * l.qty })), total: data.total, paid: paid || null };
  $("doneQ").textContent = data.queue_name;
  $("doneInfo").textContent = lines + " — Total " + rupiah(data.total) + payInfo;
  $("doneBox").classList.remove("hide");
  cart.clear(); $("cname").value = ""; $("cnote").value = ""; $("cpaid").value = ""; renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
};
