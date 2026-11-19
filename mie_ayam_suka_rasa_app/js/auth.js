// LOGIN / LOGOUT + peran (pemilik / kasir).
/* ---------- AUTH ---------- */
// Tab yang hanya boleh dibuka pemilik (dijaga juga oleh database, ini hanya tampilan).
const OWNER_TABS = ["laporan", "produk", "pengguna"];
function applyRoleTabs() {
  for (const k of OWNER_TABS) {
    const b = $("tab" + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle("hide", myRole === "kasir");
  }
}
async function refreshAuth() {
  const { data: { session } } = await db.auth.getSession();
  isAdmin = false; myRole = null;
  $("btnGateLogout").classList.toggle("hide", !session);
  if (!session) {
    $("who").textContent = "";
    $("gateNote").textContent = "Pengguna pertama yang masuk otomatis menjadi pemilik. Kasir lain ditambahkan oleh pemilik di tab Pengguna.";
    applyRoleTabs(); return;
  }
  const { data: ok, error } = await db.rpc("claim_admin");
  if (error || !ok) {
    $("who").textContent = session.user.email + " (belum punya akses)";
    $("gateNote").textContent = "Akun ini belum didaftarkan sebagai kasir atau pemilik. Minta pemilik menambahkan email Anda di tab Pengguna, lalu masuk lagi.";
    applyRoleTabs(); return;
  }
  const { data: role } = await db.rpc("my_role");
  myRole = role === "pemilik" ? "pemilik" : "kasir";
  isAdmin = true;
  $("who").textContent = (myRole === "pemilik" ? "Pemilik: " : "Kasir: ") + session.user.email;
  applyRoleTabs();
}
$("btnLogin").onclick = async () => {
  const { error } = await db.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
  if (error) return show("Gagal masuk: " + error.message, "err");
  show("Berhasil masuk.", "ok"); tab(currentTab);
};
$("btnSignup").onclick = async () => {
  const { data, error } = await db.auth.signUp({ email: $("email").value.trim(), password: $("password").value });
  if (error) return show("Gagal daftar: " + error.message, "err");
  if (data.session) { show("Akun dibuat.", "ok"); tab(currentTab); }
  else show("Akun dibuat. Cek email untuk konfirmasi, lalu masuk. Setelah itu minta pemilik menambahkan Anda sebagai kasir.", "ok");
};
$("btnGateLogout").onclick = async () => { await db.auth.signOut(); isAdmin = false; myRole = null; $("who").textContent = ""; applyRoleTabs(); tab(currentTab); };
