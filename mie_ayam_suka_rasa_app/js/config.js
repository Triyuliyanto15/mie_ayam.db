// KONFIGURASI + fungsi bantu (format Rupiah, tanggal, input nominal, pesan notifikasi).
// Ubah alamat/kunci Supabase di bagian atas file ini.
// Key publik (aman di browser). Akses data dibatasi oleh Row Level Security di Supabase.
const SUPABASE_URL = "https://xwxcegylykvqzwypypvx.supabase.co";
const SUPABASE_KEY = "sb_publishable_I-fiTcoCDDGYX1ay9a5TnQ_Te3xFCzN";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const h = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e[k] = v;
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const todayWIB = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
const timeWIB = (ts) => {
  if (!ts) return "";
  const s = /Z|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z";
  return new Date(s).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
};

const dateTimeWIB = (ts) => {
  if (!ts) return "";
  const s = /Z|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z";
  return new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
};

/* ---------- INPUT NOMINAL (pemisah ribuan otomatis) ---------- */
const digits = (s) => String(s || "").replace(/\D/g, "").slice(0, 10);
const numOf = (el) => parseInt(digits(el.value), 10) || 0;
function money(el, cb) {
  el.setAttribute("inputmode", "numeric");
  el.setAttribute("autocomplete", "off");
  el.addEventListener("input", () => {
    const d = digits(el.value);
    el.value = d ? Number(d).toLocaleString("id-ID") : "";
    if (cb) cb();
  });
}

let isAdmin = false, currentTab = "menu", products = [], cart = new Map(), orderFilter = "MENUNGGU", refreshTimer = null, cartTotal = 0;

function show(text, type) {
  const m = $("msg");
  m.className = "msg " + (type || "ok");
  m.textContent = text;
  m.hidden = !text;
  clearTimeout(show.t);
  if (text) show.t = setTimeout(() => { m.hidden = true; }, 6000);
}
