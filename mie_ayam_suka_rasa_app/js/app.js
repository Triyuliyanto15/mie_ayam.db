// NAVIGASI antar tab. Menambah tab baru: daftarkan di 'views' dan 'tabs', lalu buat file di views/ dan js/.
/* ---------- NAVIGASI ---------- */
const views = { menu: "viewMenu", kasir: "viewKasir", antrean: "viewAntrean", laporan: "viewLaporan", produk: "viewProduk" };
const tabs = { menu: "tabMenu", kasir: "tabKasir", antrean: "tabAntrean", laporan: "tabLaporan", produk: "tabProduk" };
async function tab(name) {
  currentTab = name;
  clearInterval(refreshTimer);
  for (const k of Object.keys(views)) {
    $(tabs[k]).classList.toggle("on", k === name);
    $(views[k]).classList.add("hide");
  }
  $("viewGate").classList.add("hide");
  if (name === "menu") { $(views.menu).classList.remove("hide"); loadMenu(); return; }
  await refreshAuth();
  if (!isAdmin) { $("viewGate").classList.remove("hide"); return; }
  $(views[name]).classList.remove("hide");
  if (name === "kasir") loadPos();
  if (name === "antrean") { loadOrders(); refreshTimer = setInterval(loadOrders, 15000); }
  if (name === "laporan") loadReport();
  if (name === "produk") loadAdmin();
}
for (const k of Object.keys(tabs)) $(tabs[k]).onclick = () => tab(k);


loadMenu();
