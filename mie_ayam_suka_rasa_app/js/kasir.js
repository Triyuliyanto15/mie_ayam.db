// TAB KASIR: keranjang, topping/pilihan, tipe pesanan, metode bayar, simpan pesanan.
/* ---------- KASIR ---------- */
const PAY_CHOICES = [["TUNAI", "Tunai"], ["QRIS", "QRIS"], ["TRANSFER", "Transfer"], ["LATER", "Bayar nanti"]];

async function loadModifiers() {
  const { data, error } = await db.from("modifier_groups")
    .select("id,name,multi,required,category,sort,modifiers(id,name,price,active,sort)")
    .eq("active", true).order("sort").order("id");
  if (error) { show("Gagal memuat topping: " + error.message, "err"); modGroups = []; return; }
  modGroups = data
    .map((g) => ({ ...g, modifiers: (g.modifiers || []).filter((m) => m.active).sort((a, b) => a.sort - b.sort || a.id - b.id) }))
    .filter((g) => g.modifiers.length > 0);
}
const groupsFor = (p) => modGroups.filter((g) => !g.category || g.category === p.category);

async function loadPos() {
  products = await fetchActive();
  await loadModifiers();
  $("posGrid").replaceChildren(...products.map((p) => productCard(p, () => pickProduct(p))));
  $("posEmpty").hidden = products.length > 0;
  renderChoices();
  renderCart();
}
function pickProduct(p) {
  const gs = groupsFor(p);
  if (gs.length) openModal(p, gs); else addLine(p, []);
}
// Jendela pilihan topping / level pedas
function openModal(p, groups) {
  const chosen = new Map(groups.map((g) => [g.id, new Set()]));
  const add = h("button", { class: "btn ok", type: "button" });
  const err = h("div", { class: "merr" });
  const unit = () => p.price + groups.reduce((s, g) => s + g.modifiers.filter((m) => chosen.get(g.id).has(m.id)).reduce((a, m) => a + m.price, 0), 0);
  const sync = () => { add.textContent = "Tambah ke pesanan · " + rupiah(unit()); };
  const sections = groups.map((g) => {
    const btns = new Map();
    const paint = () => { for (const [id, b] of btns) b.classList.toggle("on", chosen.get(g.id).has(id)); };
    for (const m of g.modifiers) {
      btns.set(m.id, h("button", { class: "chip", type: "button", onclick: () => {
        const set = chosen.get(g.id);
        if (set.has(m.id)) set.delete(m.id);
        else { if (!g.multi) set.clear(); set.add(m.id); }
        err.textContent = ""; paint(); sync();
      } }, m.name + (m.price ? " +" + rupiah(m.price) : "")));
    }
    return h("div", { class: "mgroup" },
      h("div", { class: "mtitle" }, g.name, " ", h("span", { class: "muted" }, (g.required ? "wajib" : "opsional") + (g.multi ? ", boleh lebih dari satu" : ", pilih satu"))),
      h("div", { class: "chips" }, [...btns.values()]));
  });
  const bg = h("div", { class: "modal-bg", onclick: (e) => { if (e.target === bg) bg.remove(); } },
    h("div", { class: "modal card" },
      h("h2", {}, p.name), h("div", { class: "muted" }, rupiah(p.price)),
      ...sections, err,
      h("div", { class: "actions" }, add, h("button", { class: "btn ghost", type: "button", onclick: () => bg.remove() }, "Batal"))));
  add.onclick = () => {
    for (const g of groups) if (g.required && chosen.get(g.id).size === 0) { err.textContent = "Pilih dulu: " + g.name; return; }
    const mods = groups.flatMap((g) => g.modifiers.filter((m) => chosen.get(g.id).has(m.id)));
    bg.remove(); addLine(p, mods);
  };
  sync();
  document.body.append(bg);
}
function addLine(p, mods) {
  const key = p.id + "|" + mods.map((m) => m.id).sort((a, b) => a - b).join(",");
  const line = cart.get(key);
  if (line) line.qty = Math.min(99, line.qty + 1);
  else cart.set(key, { p, mods, qty: 1, unit: p.price + mods.reduce((s, m) => s + m.price, 0) });
  renderCart();
}
function renderChoices() {
  $("typeChips").replaceChildren(...Object.entries(ORDER_TYPES).map(([k, label]) =>
    h("button", { type: "button", class: "chip" + (orderType === k ? " on" : ""), onclick: () => { orderType = k; renderChoices(); } }, label)));
  $("methodChips").replaceChildren(...PAY_CHOICES.map(([k, label]) =>
    h("button", { type: "button", class: "chip" + (payMethod === k ? " on" : ""), onclick: () => { payMethod = k; renderChoices(); calcChange(); } }, label)));
  $("cashBox").classList.toggle("hide", payMethod !== "TUNAI");
  $("payNote").classList.toggle("hide", payMethod !== "QRIS" && payMethod !== "TRANSFER");
}
function calcChange() {
  const el = $("cChange"), has = $("cpaid").value !== "", paid = numOf($("cpaid"));
  if (!has) { el.textContent = "-"; el.style.color = ""; }
  else if (paid < cartTotal) { el.textContent = "Kurang " + rupiah(cartTotal - paid); el.style.color = "var(--bad)"; }
  else { el.textContent = rupiah(paid - cartTotal); el.style.color = "var(--ok)"; }
  if (payMethod === "QRIS") $("payNote").textContent = "Minta pelanggan membayar QRIS sebesar " + rupiah(cartTotal) + ". Pastikan pembayaran sudah masuk sebelum menyimpan.";
  if (payMethod === "TRANSFER") $("payNote").textContent = "Pastikan transfer sebesar " + rupiah(cartTotal) + " sudah masuk sebelum menyimpan.";
  $("btnOrder").disabled = cart.size === 0 || (payMethod === "TUNAI" && (!has || paid < cartTotal));
}
function renderCart() {
  const box = $("cart"); box.replaceChildren();
  let total = 0;
  for (const [key, l] of cart) {
    total += l.unit * l.qty;
    box.append(h("div", { class: "cartline" },
      h("div", {},
        h("div", {}, l.p.name),
        l.mods.length ? h("div", { class: "muted" }, l.mods.map((m) => m.name).join(", ")) : null,
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
$("btnClear").onclick = () => { cart.clear(); $("cpaid").value = ""; renderCart(); };
$("btnNext").onclick = () => $("doneBox").classList.add("hide");
$("btnOrder").onclick = async () => {
  if (cart.size === 0) return;
  const paid = numOf($("cpaid"));
  if (payMethod === "TUNAI" && paid < cartTotal) return show("Uang diterima kurang dari total (" + rupiah(cartTotal) + ").", "err");
  const btn = $("btnOrder"); btn.disabled = true;
  const lines = [...cart.values()];
  const args = {
    p_items: lines.map((l) => ({ product_id: l.p.id, qty: l.qty, modifier_ids: l.mods.map((m) => m.id) })),
    p_customer: $("cname").value, p_note: $("cnote").value, p_type: orderType };
  if (payMethod !== "LATER") { args.p_pay_method = payMethod; if (payMethod === "TUNAI") args.p_paid = paid; }
  const { data, error } = await db.rpc("create_order", args);
  if (error) { show("Gagal menyimpan pesanan: " + error.message, "err"); calcChange(); return; }
  const text = lines.map((l) => l.qty + "× " + l.p.name + (l.mods.length ? " (" + l.mods.map((m) => m.name).join(", ") + ")" : "")).join(", ");
  let payInfo = " — Belum dibayar";
  if (data.payment_method === "TUNAI") payInfo = " — Tunai " + rupiah(data.paid) + ", Kembalian " + rupiah(data.change);
  else if (data.payment_method) payInfo = " — Lunas (" + PAY_METHODS[data.payment_method] + ")";
  lastNota = { queue: data.queue_name, customer: $("cname").value.trim(), note: $("cnote").value.trim(), when: dateTimeWIB(new Date().toISOString()),
    type: orderType, method: data.payment_method || null,
    items: lines.map((l) => ({ name: l.p.name + (l.mods.length ? " (" + l.mods.map((m) => m.name).join(", ") + ")" : ""), qty: l.qty, price: l.unit, sub: l.unit * l.qty })),
    total: data.total, paid: data.payment_method ? data.paid : null };
  $("doneQ").textContent = data.queue_name;
  $("doneInfo").textContent = ORDER_TYPES[orderType] + " · " + text + " — Total " + rupiah(data.total) + payInfo;
  $("doneBox").classList.remove("hide");
  cart.clear(); $("cname").value = ""; $("cnote").value = ""; $("cpaid").value = ""; orderType = "DINE_IN";
  renderChoices(); renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
};
