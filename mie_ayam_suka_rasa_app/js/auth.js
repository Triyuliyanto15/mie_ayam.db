// LOGIN / LOGOUT admin-kasir.
/* ---------- AUTH ---------- */
async function refreshAuth() {
  const { data: { session } } = await db.auth.getSession();
  isAdmin = false; isOwner = false; applyRole();
  $("btnGateLogout").classList.toggle("hide", !session);
  if (!session) { $("who").textContent = ""; $("gateNote").textContent = "Pengguna pertama yang masuk otomatis menjadi admin. Akun lain tidak bisa membuat pesanan atau mengubah produk."; return; }
  const { data: ok, error } = await db.rpc("claim_admin");
  if (error || !ok) {
    $("who").textContent = session.user.email + " (bukan admin)";
    $("gateNote").textContent = "Akun ini bukan admin/kasir, jadi tidak bisa membuka halaman ini. Keluar lalu masuk dengan akun admin.";
    return;
  }
  const { data: role } = await db.rpc("my_role");
  isOwner = role === "pemilik"; isAdmin = true; applyRole();
  $("who").textContent = (isOwner ? "Pemilik: " : "Kasir: ") + session.user.email;
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
  else show("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.", "ok");
};
$("btnGateLogout").onclick = async () => { await db.auth.signOut(); isAdmin = false; $("who").textContent = ""; tab(currentTab); };
