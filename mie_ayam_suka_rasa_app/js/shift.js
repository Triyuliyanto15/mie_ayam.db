// TAB TUTUP KASIR: buka kasir (kas awal), pantau penjualan per metode, tutup kasir dan hitung selisih uang tunai.
/* ---------- BUKA / TUTUP KASIR ---------- */
let shiftExpected = 0;
const diffText = (d) => d === 0 ? "Pas" : d > 0 ? "Lebih " + rupiah(d) : "Kurang " + rupiah(-d);
const diffColor = (d) => d === 0 ? "var(--ok)" : "var(--bad)";
async function loadShift() {
  const { data, error } = await db.rpc("shift_current");
  if (error) return show("Gagal memuat kasir: " + error.message, "err");
  renderShift(data);
  if (myRole === "pemilik") loadShiftHistory(); else $("shiftHistBox").classList.add("hide");
}
function renderShift(s) {
  $("shiftOpenBox").classList.toggle("hide", !!s);
  $("shiftRunBox").classList.toggle("hide", !s);
  if (!s) return;
  shiftExpected = s.expected_cash;
  $("sSince").textContent = "Dibuka " + dateTimeWIB(s.opened_at);
  $("sOpen").textContent = rupiah(s.opening_cash);
  $("sCash").textContent = rupiah(s.cash_sales);
  $("sQris").textContent = rupiah(s.qris_sales);
  $("sTrf").textContent = rupiah(s.transfer_sales);
  $("sOrders").textContent = s.orders;
  $("sExpected").textContent = rupiah(s.expected_cash);
  const w = $("sWarn");
  w.classList.toggle("hide", !s.unpaid);
  if (s.unpaid) w.textContent = "Masih ada " + s.unpaid + " pesanan hari ini yang belum dibayar. Selesaikan pembayarannya di tab Antrean sebelum menutup kasir.";
  calcDiff();
}
function calcDiff() {
  const el = $("sDiff");
  if ($("sCounted").value === "") { el.textContent = "-"; el.style.color = ""; return; }
  const d = numOf($("sCounted")) - shiftExpected;
  el.textContent = diffText(d); el.style.color = diffColor(d);
}
money($("sOpening"));
money($("sCounted"), calcDiff);
$("btnShiftOpen").onclick = async () => {
  const { data, error } = await db.rpc("shift_open", { p_opening_cash: numOf($("sOpening")) });
  if (error) return show("Gagal membuka kasir: " + error.message, "err");
  $("sOpening").value = ""; $("shiftDoneBox").classList.add("hide");
  show("Kasir dibuka.", "ok"); renderShift(data);
};
$("btnShiftClose").onclick = async () => {
  if ($("sCounted").value === "") return show("Isi dulu jumlah uang tunai yang dihitung di laci.", "err");
  const counted = numOf($("sCounted"));
  if (!confirm("Tutup kasir sekarang? Uang tunai di laci: " + rupiah(counted) + ".")) return;
  const { data, error } = await db.rpc("shift_close", { p_counted_cash: counted, p_note: $("sNote").value });
  if (error) return show("Gagal menutup kasir: " + error.message, "err");
  $("sCounted").value = ""; $("sNote").value = "";
  const box = $("shiftDoneBox");
  box.replaceChildren(
    h("div", { class: "muted" }, "Kasir ditutup · " + dateTimeWIB(data.closed_at)),
    h("div", { class: "bignum", style: "font-size:2.2rem;color:" + diffColor(data.difference) }, diffText(data.difference)),
    h("div", {}, "Kas awal " + rupiah(data.opening_cash) + " + penjualan tunai " + rupiah(data.cash_sales) + " = seharusnya " + rupiah(data.expected_cash) + ", dihitung " + rupiah(data.counted_cash)),
    h("div", { class: "muted" }, "QRIS " + rupiah(data.qris_sales) + " · Transfer " + rupiah(data.transfer_sales) + " · " + data.orders + " pesanan lunas"));
  box.classList.remove("hide");
  show("Kasir ditutup.", "ok"); loadShift();
};
async function loadShiftHistory() {
  const { data, error } = await db.from("cash_shifts").select("*").eq("status", "TUTUP").order("closed_at", { ascending: false }).limit(14);
  if (error) return show("Gagal memuat riwayat: " + error.message, "err");
  $("shiftHistBox").classList.toggle("hide", data.length === 0);
  $("shiftRows").replaceChildren(...data.map((r) => h("tr", {},
    h("td", {}, dateTimeWIB(r.closed_at)), h("td", {}, rupiah(r.opening_cash)), h("td", {}, rupiah(r.cash_sales)),
    h("td", {}, rupiah(r.qris_sales)), h("td", {}, rupiah(r.transfer_sales)), h("td", {}, rupiah(r.expected_cash)),
    h("td", {}, rupiah(r.counted_cash)), h("td", { style: "color:" + diffColor(r.difference) + ";font-weight:700" }, diffText(r.difference)))));
}
