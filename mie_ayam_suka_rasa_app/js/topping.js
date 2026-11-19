// TOPPING & PILIHAN (pemilik): kelompok pilihan (mis. Topping, Level Pedas) dan opsinya.
/* ---------- TOPPING & PILIHAN ---------- */
async function loadToppings() {
  const { data, error } = await db.from("modifier_groups")
    .select("id,name,multi,required,category,sort,active,modifiers(id,name,price,active,sort)")
    .order("sort").order("id");
  if (error) return show("Gagal memuat topping: " + error.message, "err");
  $("toppingList").replaceChildren(...data.map(groupBox));
}
function groupBox(g) {
  const opts = (g.modifiers || []).sort((a, b) => a.sort - b.sort || a.id - b.id);
  const nameIn = h("input", { type: "text", placeholder: "Nama pilihan", maxlength: "40" });
  const priceIn = h("input", { type: "text", placeholder: "Harga tambahan (0 jika gratis)" });
  money(priceIn);
  return h("div", { class: "mgroupbox" },
    h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" },
      h("b", {}, g.name),
      h("span", { class: "tag info" }, g.category || "Semua kategori"),
      h("span", { class: "tag " + (g.multi ? "on" : "wait") }, g.multi ? "Boleh banyak" : "Pilih satu"),
      g.required ? h("span", { class: "tag off" }, "Wajib") : null,
      h("span", { class: "tag " + (g.active ? "on" : "off") }, g.active ? "Aktif" : "Nonaktif"),
      h("button", { class: "btn ghost sm", type: "button", onclick: () => tgUpdate("modifier_groups", g.id, { active: !g.active }) }, g.active ? "Nonaktifkan" : "Aktifkan"),
      h("button", { class: "btn bad sm", type: "button", onclick: () => { if (confirm('Hapus kelompok "' + g.name + '" beserta semua pilihannya?')) tgDelete("modifier_groups", g.id); } }, "Hapus")),
    h("div", { class: "tablewrap" }, h("table", {}, h("tbody", {}, opts.map((m) => h("tr", {},
      h("td", {}, m.name), h("td", {}, m.price ? "+" + rupiah(m.price) : "Gratis"),
      h("td", {}, h("span", { class: "tag " + (m.active ? "on" : "off") }, m.active ? "Aktif" : "Nonaktif")),
      h("td", {},
        h("button", { class: "btn ghost sm", type: "button", onclick: () => tgPrice(m) }, "Harga"), " ",
        h("button", { class: "btn ghost sm", type: "button", onclick: () => tgUpdate("modifiers", m.id, { active: !m.active }) }, m.active ? "Nonaktifkan" : "Aktifkan"), " ",
        h("button", { class: "btn bad sm", type: "button", onclick: () => { if (confirm('Hapus pilihan "' + m.name + '"?')) tgDelete("modifiers", m.id); } }, "Hapus"))))))),
    h("div", { class: "payrow" }, nameIn, priceIn,
      h("button", { class: "btn sm", type: "button", onclick: async () => {
        const name = nameIn.value.trim();
        if (!name) return show("Isi nama pilihan.", "err");
        const { error } = await db.from("modifiers").insert({ group_id: g.id, name, price: numOf(priceIn), active: true, sort: opts.length + 1 });
        if (error) return show("Gagal menambah: " + (error.code === "23505" ? "nama pilihan sudah ada di kelompok ini." : error.message), "err");
        show("Pilihan ditambahkan.", "ok"); loadToppings();
      } }, "Tambah")));
}
async function tgUpdate(table, id, patch) {
  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) return show("Gagal menyimpan: " + error.message, "err");
  loadToppings();
}
async function tgDelete(table, id) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return show("Gagal menghapus: " + error.message, "err");
  show("Dihapus.", "ok"); loadToppings();
}
function tgPrice(m) {
  const v = prompt("Harga tambahan untuk " + m.name + " (Rp):", String(m.price));
  if (v === null) return;
  const n = parseInt(digits(v), 10);
  if (!Number.isInteger(n) || n < 0) return show("Harga harus angka 0 atau lebih.", "err");
  tgUpdate("modifiers", m.id, { price: n });
}
$("btnGroupAdd").onclick = async () => {
  const name = $("tgName").value.trim();
  if (!name) return show("Isi nama kelompok.", "err");
  const { error } = await db.from("modifier_groups").insert({ name, category: $("tgCat").value || null, multi: $("tgMulti").checked, required: $("tgReq").checked, sort: 10 });
  if (error) return show("Gagal menambah: " + (error.code === "23505" ? "nama kelompok sudah ada." : error.message), "err");
  $("tgName").value = ""; show("Kelompok ditambahkan.", "ok"); loadToppings();
};
