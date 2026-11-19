// PEMUAT APLIKASI: memuat isi tab dari folder views/, lalu file JavaScript satu per satu.
// Urutan di SCRIPTS penting: file di bawah boleh memakai fungsi dari file di atasnya.
const VIEWS = ["menu", "login", "kasir", "antrean", "tutup", "laporan", "produk"];
const SCRIPTS = ["config", "auth", "menu", "nota", "suara", "kasir", "antrean", "tutup", "laporan", "produk", "app"];

(async () => {
  const parts = await Promise.all(VIEWS.map((v) => fetch("views/" + v + ".html").then((r) => {
    if (!r.ok) throw new Error("views/" + v + ".html tidak ditemukan");
    return r.text();
  })));
  document.getElementById("views").innerHTML = parts.join("\n");
  for (const f of SCRIPTS) {
    await new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "js/" + f + ".js";
      s.onload = ok;
      s.onerror = () => fail(new Error("js/" + f + ".js gagal dimuat"));
      document.body.append(s);
    });
  }
})().catch((e) => {
  document.getElementById("views").textContent = "Aplikasi gagal dimuat: " + e.message;
});
