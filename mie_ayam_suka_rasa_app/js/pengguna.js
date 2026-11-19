// TAB PENGGUNA (pemilik): tambah kasir, ubah peran, cabut akses.
/* ---------- PENGGUNA ---------- */
async function loadStaff() {
  const { data, error } = await db.rpc("list_staff");
  if (error) return show("Gagal memuat pengguna: " + error.message, "err");
  $("staffRows").replaceChildren(...data.map((u) => h("tr", {},
    h("td", {}, u.email),
    h("td", {}, h("span", { class: "tag " + (u.role === "pemilik" ? "on" : "info") }, u.role === "pemilik" ? "Pemilik" : "Kasir")),
    h("td", {},
      h("button", { class: "btn ghost sm", type: "button", onclick: () => setStaff(u.email, u.role === "pemilik" ? "kasir" : "pemilik") },
        u.role === "pemilik" ? "Jadikan Kasir" : "Jadikan Pemilik"), " ",
      h("button", { class: "btn bad sm", type: "button", onclick: () => { if (confirm("Cabut akses " + u.email + "?")) setStaff(u.email, "hapus"); } }, "Cabut akses")))));
}
async function setStaff(email, role) {
  const { error } = await db.rpc("set_staff", { p_email: email, p_role: role });
  if (error) { show(error.message, "err"); return false; }
  show(role === "hapus" ? "Akses dicabut." : "Peran disimpan.", "ok"); loadStaff();
  return true;
}
$("btnStaffSave").onclick = async () => {
  const email = $("uEmail").value.trim();
  if (!email) return show("Isi email pengguna.", "err");
  if (await setStaff(email, $("uRole").value)) $("uEmail").value = "";
};
