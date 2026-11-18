// TAB PRODUK: tambah/edit/hapus produk + upload foto produk.
/* ---------- PRODUK ---------- */
money($("pprice"));
function setPreview(url) {
  $("pimgBox").classList.toggle("hide", !url);
  if (url) $("ppreview").src = url;
}
function shrink(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => b ? res(b) : rej(new Error("Gagal memproses gambar.")), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("File gambar tidak bisa dibaca. Pakai JPG atau PNG.")); };
    img.src = url;
  });
}
$("pfile").onchange = async () => {
  const f = $("pfile").files[0];
  if (!f) return;
  const save = $("btnSave"); save.disabled = true;
  show("Mengunggah gambar…", "ok");
  try {
    const blob = await shrink(f);
    const path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    const { error } = await db.storage.from("menu-images").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw error;
    const url = db.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
    $("pimg").value = url; setPreview(url);
    show("Gambar terunggah. Klik Simpan untuk menyimpan produk.", "ok");
  } catch (e) { show("Gagal mengunggah gambar: " + e.message, "err"); $("pfile").value = ""; }
  save.disabled = false;
};
$("btnImgDel").onclick = () => { $("pimg").value = ""; $("pfile").value = ""; setPreview(""); };
async function loadAdmin() {
  const { data, error } = await db.from("products").select("*").order("category").order("name");
  if (error) return show("Gagal memuat produk: " + error.message, "err");
  $("rows").replaceChildren(...data.map((p) => h("tr", {},
    h("td", {}, p.name), h("td", {}, p.category), h("td", {}, rupiah(p.price)),
    h("td", {}, h("span", { class: "tag " + (p.active ? "on" : "off") }, p.active ? "Aktif" : "Nonaktif")),
    h("td", {},
      h("button", { class: "btn ghost sm", type: "button", onclick: () => editProduct(p) }, "Edit"), " ",
      h("button", { class: "btn ghost sm", type: "button", onclick: () => toggle(p) }, p.active ? "Nonaktifkan" : "Aktifkan"), " ",
      h("button", { class: "btn bad sm", type: "button", onclick: () => remove(p) }, "Hapus")))));
}
function resetForm() {
  $("pid").value = ""; $("pname").value = ""; $("pprice").value = ""; $("pcat").value = "Mie Ayam";
  $("pstock").value = 0; $("pdesc").value = ""; $("pimg").value = ""; $("pfile").value = ""; setPreview(""); $("pactive").checked = true;
  $("formTitle").textContent = "Tambah Produk";
}
$("btnReset").onclick = resetForm;
function editProduct(p) {
  $("pid").value = p.id; $("pname").value = p.name; $("pprice").value = Number(p.price).toLocaleString("id-ID"); $("pcat").value = p.category;
  $("pstock").value = p.stock; $("pdesc").value = p.description || ""; $("pimg").value = p.image_url || ""; $("pfile").value = ""; setPreview(p.image_url);
  $("pactive").checked = p.active; $("formTitle").textContent = "Edit Produk";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("btnSave").onclick = async () => {
  const name = $("pname").value.trim(), price = parseInt(digits($("pprice").value), 10), stock = parseInt($("pstock").value, 10) || 0;
  if (!name) return show("Nama produk wajib diisi.", "err");
  if (!Number.isInteger(price) || price < 0) return show("Harga harus angka 0 atau lebih.", "err");
  const row = { name, price, stock, category: $("pcat").value, description: $("pdesc").value.trim() || null,
                image_url: $("pimg").value.trim() || null, active: $("pactive").checked };
  const id = $("pid").value;
  const { error } = id ? await db.from("products").update(row).eq("id", id) : await db.from("products").insert(row);
  if (error) return show("Gagal menyimpan: " + (error.code === "23505" ? "nama produk sudah ada." : error.message), "err");
  show(id ? "Produk diperbarui." : "Produk ditambahkan.", "ok"); resetForm(); loadAdmin();
};
async function toggle(p) {
  const { error } = await db.from("products").update({ active: !p.active }).eq("id", p.id);
  if (error) return show(error.message, "err"); loadAdmin();
}
async function remove(p) {
  if (!confirm('Hapus "' + p.name + '"? Riwayat pesanan lama tetap tersimpan.')) return;
  const { error } = await db.from("products").delete().eq("id", p.id);
  if (error) return show(error.message, "err"); show("Produk dihapus.", "ok"); loadAdmin();
}
