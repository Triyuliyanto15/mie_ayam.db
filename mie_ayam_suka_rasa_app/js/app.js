// NAVIGASI antar tab + pembatasan peran (Laporan & Produk khusus Pemilik).
const views = { menu: "viewMenu", kasir: "viewKasir", antrean: "viewAntrean", tutup: "viewTutup", laporan: "viewLaporan", produk: "viewProduk" };
const tabs = { menu: "tabMenu", kasir: "tabKasir", antrean: "tabAntrean", tutup: "tabTutup", laporan: "tabLaporan", produk: "tabProduk" };
const OWNER_ONLY = ["laporan", "produk"];
function applyRole() { for (const k of OWNER_ONLY) $(tabs[k]).classList.toggle("hide", !isOwner); }
async function tab(name) {
  currentTab = name;
  clearInterval(refreshTimer);
  for (const k of Object.keys(views)) {
    $(tabs[k]).classList.toggle("on", k === name);
    if (k === name) { $(tabs[k]).setAttribute("aria-current", "page"); $(tabs[k]).scrollIntoView({ inline: "center", block: "nearest" }); } else $(tabs[k]).removeAttribute("aria-current");
    $(views[k]).classList.add("hide");
  }
  $("viewGate").classList.add("hide");
  if (name === "menu") { $(views.menu).classList.remove("hide"); loadMenu(); return; }
  await refreshAuth();
  if (!isAdmin) { $("viewGate").classList.remove("hide"); return; }
  if (OWNER_ONLY.includes(name) && !isOwner) { show("Menu ini khusus Pemilik.", "err"); return tab("kasir"); }
  $(views[name]).classList.remove("hide");
  if (name === "kasir") loadPos();
  if (name === "antrean") { loadOrders(); refreshTimer = setInterval(loadOrders, 15000); }
  if (name === "tutup") loadShift();
  if (name === "laporan") loadReport();
  if (name === "produk") loadAdmin();
}
for (const k of Object.keys(tabs)) $(tabs[k]).onclick = () => tab(k);
applyRole();
loadMenu();
