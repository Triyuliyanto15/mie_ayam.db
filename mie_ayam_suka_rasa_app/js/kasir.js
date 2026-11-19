// TAB KASIR: tipe pesanan, topping/level pedas, metode bayar, uang diterima, kembalian.
const TYPE_LABEL = { DINE_IN: "Makan di tempat", TAKEAWAY: "Bungkus", ONLINE: "GoFood/Grab" };
const PAY = [["TUNAI", "Tunai"], ["QRIS", "QRIS"], ["TRANSFER", "Transfer"]];
let groups = [], mods = {}, orderType = "DINE_IN", payMethod = "TUNAI", sel = new Set();

function chipRow(el, list, isOn, pick) {
  el.replaceChildren(...list.map(([k, t]) => h("button", { type: "button", class: "chip" + (isOn(k) ? " on" : ""), onclick: () => pick(k) }, t)));
}
function renderChoices() {
  chipRow($("typeChips"), Object.entries(TYPE_LABEL), (k) => k === orderType, (k) => { orderType = k; renderChoices(); });
  chipRow($("payChips"), PAY, (k) => k === payMethod, (k) => { payMethod = k; $("cashBox").classList.toggle("hide", k !== "TUNAI"); calcChange(); renderChoices(); });
  $("optBox").replaceChildren(...groups.map((g) => h("div", { style: "margin-bottom:8px" },
    h("div", { class: "muted" }, g.name + (g.required ? " (wajib)" : "") + " — pilih dulu, lalu ketuk menu"),
    h("div", { class: "chips" }, g.items.map((m) => h("button", { type: "button", class: "chip" + (sel.has(m.id) ? " on" : ""), onclick: () => togglePick(g, m.id) }, m.name + (m.price ? " +" + nf2(m.price) : "")))))));
}
function togglePick(g, id) {
  if (sel.has(id)) sel.delete(id);
  else { if (!g.multi) g.items.forEach((m) => sel.delete(m.id)); sel.add(id); }
  renderChoices();
}
async function loadPos() {
  products = await fetchActive();
  const [g, m] = await Promise.all([
    db.from("modifier_groups").select("id,name,multi,required,category,sort").eq("active", true).order("sort"),
    db.from("modifiers").select("id,group_id,name,price,sort").eq("active", true).order("sort")]);
  groups = (g.data || []).map((x) => ({ ...x, items: (m.data || []).filter((y) => y.group_id === x.id) })).filter((x) => x.items.length);
  mods = Object.fromEntries((m.data || []).map((y) => [y.id, y]));
  $("posGrid").replaceChildren(...products.map((p) => productCard(p, () => addToCart(p))));
  $("posEmpty").hidden = products.length > 0;
  renderChoices(); renderCart();
}
function addToCart(p) {
  const ids = groups.filter((g) => !g.category || g.category === p.category)
    .flatMap((g) => g.items.filter((m) => sel.has(m.id)).map((m) => m.id)).sort((a, b) => a - b);
  const key = p.id + "|" + ids.join(",");
  const line = cart.get(key);
  if (line) line.qty = Math.min(99, line.qty + 1);
  else cart.set(key, { p, qty: 1, ids, unit: p.price + ids.reduce((s, i) => s + (mods[i] ? mods[i].price : 0), 0), text: ids.map((i) => mods[i].name).join(", ") });
  sel.clear(); renderChoices(); renderCart();
}
function calcChange() {
  const el = $("cChange"), has = $("cpaid").value !== "", paid = numOf($("cpaid")), cash = payMethod === "TUNAI";
  if (!cash) { el.textContent = "Lunas (" + payMethod + ")"; el.style.color = "var(--ok)"; }
  else if (!has) { el.textContent = "-"; el.style.color = ""; }
  else if (paid < cartTotal) { el.textContent = "Kurang " + rupiah(cartTotal - paid); el.style.color = "var(--bad)"; }
  else { el.textContent = rupiah(paid - cartTotal); el.style.color = "var(--ok)"; }
  $("btnOrder").disabled = cart.size === 0 || (cash && has && paid < cartTotal);
}
function renderCart() {
  const box = $("cart"); box.replaceChildren();
  let total = 0;
  for (const [key, l] of cart) {
    total += l.unit * l.qty;
    box.append(h("div", { class: "cartline" },
      h("div", {}, h("div", {}, l.p.name), l.text ? h("div", { class: "muted" }, "+ " + l.text) : null,
        h("div", { class: "muted" }, rupiah(l.unit) + " × " + l.qty + " = " + rupiah(l.unit * l.qty))),
      h("div", { class: "qty" },
        h("button", { type: "button", onclick: () => { l.qty--; if (l.qty < 1) cart.delete(key); renderCart(); } }, "−"),
        h("b", {}, l.qty),
        h("button", { type: "button", onclick: () => { l.qty = Math.min(99, l.qty + 1); renderCart(); } }, "+")),
      h("button", { class: "btn bad sm", type: "button", onclick: () => { cart.delete(key); renderCart(); } }, "✕")));
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
$("btnClear").onclick = () => { cart.clear(); sel.clear(); $("cpaid").value = ""; renderChoices(); renderCart(); };
$("btnNext").onclick = () => $("doneBox").classList.add("hide");
$("btnOrder").onclick = async () => {
  if (cart.size === 0) return;
  const cash = payMethod === "TUNAI", paid = cash && $("cpaid").value !== "" ? numOf($("cpaid")) : 0;
  if (paid && paid < cartTotal) return show("Uang diterima kurang dari total (" + rupiah(cartTotal) + ").", "err");
  const btn = $("btnOrder"); btn.disabled = true;
  const lines = [...cart.values()];
  const { data, error } = await db.rpc("create_order", {
    p_items: lines.map((l) => ({ product_id: l.p.id, qty: l.qty, modifier_ids: l.ids })),
    p_customer: $("cname").value, p_note: $("cnote").value, p_type: orderType,
    p_pay_method: cash ? (paid ? "TUNAI" : null) : payMethod, p_paid: paid || null });
  if (error) { show("Gagal menyimpan pesanan: " + error.message, "err"); btn.disabled = false; return; }
  const nm = (l) => l.p.name + (l.text ? " (" + l.text + ")" : "");
  const payInfo = !data.payment_method ? " — Belum dibayar"
    : data.payment_method === "TUNAI" ? " — Diterima " + rupiah(data.paid) + ", Kembalian " + rupiah(data.change) : " — Lunas via " + data.payment_method;
  lastNota = { queue: data.queue_name, customer: $("cname").value.trim(), note: $("cnote").value.trim(), when: dateTimeWIB(new Date().toISOString()),
    type: orderType, method: data.payment_method, items: lines.map((l) => ({ name: nm(l), qty: l.qty, price: l.unit, sub: l.unit * l.qty })),
    total: data.total, paid: data.payment_method ? data.paid : null };
  $("doneQ").textContent = data.queue_name;
  $("doneInfo").textContent = TYPE_LABEL[orderType] + " · " + lines.map((l) => l.qty + "× " + nm(l)).join(", ") + " — Total " + rupiah(data.total) + payInfo;
  $("doneBox").classList.remove("hide");
  cart.clear(); $("cname").value = ""; $("cnote").value = ""; $("cpaid").value = ""; renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
};
