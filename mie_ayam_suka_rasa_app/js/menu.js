// TAB MENU (daftar menu publik) + kartu produk yang juga dipakai di Kasir.
/* ---------- MENU PUBLIK ---------- */
function productCard(p, onclick) {
  const img = h("div", { class: "img" });
  if (p.image_url) img.append(h("img", { src: p.image_url, alt: p.name, loading: "lazy" }));
  else img.textContent = p.category === "Minuman" ? "🧋" : "🍜";
  const body = h("div", { class: "body" },
    h("h3", {}, p.name), h("div", { class: "muted" }, p.category),
    p.description ? h("div", { class: "muted" }, p.description) : null,
    h("div", { class: "price" }, rupiah(p.price)));
  return h(onclick ? "button" : "div", { class: "item" + (onclick ? " pick" : ""), onclick, type: onclick ? "button" : null }, img, body);
}
async function fetchActive() {
  const { data, error } = await db.from("products")
    .select("id,name,price,category,description,image_url").eq("active", true).order("category").order("name");
  if (error) { show("Gagal memuat menu: " + error.message, "err"); return []; }
  return data;
}
async function loadMenu() {
  const data = await fetchActive();
  $("menuGrid").replaceChildren(...data.map((p) => productCard(p)));
  $("menuEmpty").hidden = data.length > 0;
}
