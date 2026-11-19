// NAVIGASI antar tab + pembatasan peran (Laporan & Produk khusus Pemilik).
const views = { menu: "viewMenu", kasir: "viewKasir", antrean: "viewAntrean", tutup: "viewTutup", laporan: "viewLaporan", produk: "viewProduk" };
const tabs = { menu: "tabMenu", kasir: "tabKasir", antrean: "tabAntrean", tutup: "tabTutup", laporan: "tabLaporan", produk: "tabProduk" };
const OWNER_ONLY = ["laporan", "produk"];
let authAt = 0;
function applyRole() { for (const k of OWNER_ONLY) $(tabs[k]).classList.toggle("hide", !isOwner); }
function markTab(name) {
  for (const k of Object.keys(tabs)) {
    const b = $(tabs[k]), on = k === name;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  }
  const b = $(tabs[name]), n = b.parentElement;   // geser bar saja, halaman tidak ikut bergulir
  n.scrollTo({ left: b.offsetLeft - (n.clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
}
// Ganti halaman dalam satu langkah (tanpa jeda kosong) agar layar tidak berkedip/melompat.
function showView(name, gate) {
  for (const k of Object.keys(views)) $(views[k]).classList.toggle("hide", gate || k !== name);
  $("viewGate").classList.toggle("hide", !gate);
}
async function tab(name) {
  clearInterval(refreshTimer);
  markTab(name);
  if (name === "menu") { currentTab = name; showView("menu"); loadMenu(); return; }
  if (!isAdmin || Date.now() - authAt > 60000) { await refreshAuth(); authAt = Date.now(); }
  if (!isAdmin) { currentTab = name; showView(name, true); return; }
  if (OWNER_ONLY.includes(name) && !isOwner) { show("Menu ini khusus Pemilik.", "err"); return tab("kasir"); }
  currentTab = name; showView(name);
  if (name === "kasir") loadPos();
  if (name === "antrean") { loadOrders(); refreshTimer = setInterval(loadOrders, 15000); }
  if (name === "tutup") loadShift();
  if (name === "laporan") loadReport();
  if (name === "produk") loadAdmin();
}
for (const k of Object.keys(tabs)) $(tabs[k]).onclick = () => tab(k);
applyRole();
loadMenu();