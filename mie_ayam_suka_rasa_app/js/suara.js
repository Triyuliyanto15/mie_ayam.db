// SUARA pemanggil antrean saat pesanan selesai (kalimat diatur di callText).
/* ---------- SUARA PEMANGGIL ---------- */
let voiceOn = true;
try { voiceOn = localStorage.getItem("voiceOn") !== "0"; } catch (e) {}
function syncVoiceBtn() { $("btnVoice").textContent = voiceOn ? "🔊 Suara: Nyala" : "🔇 Suara: Mati"; }
$("btnVoice").onclick = () => { voiceOn = !voiceOn; try { localStorage.setItem("voiceOn", voiceOn ? "1" : "0"); } catch (e) {} syncVoiceBtn(); };
syncVoiceBtn();
const sayQueue = (q) => String(q || "").replace(/[-_#]/g, " ").replace(/([A-Za-z])(\d)/g, "$1 $2").replace(/\d+/g, (n) => String(parseInt(n, 10))).trim();
function callText(o) {
  const who = (o.customer_name || "").trim();
  return (who ? "Pesanan atas nama " + who + ", " : "Pesanan ") + "nomor antrean " + sayQueue(o.queue_name || o.queue_number) + " sudah selesai. Silakan diambil. Terima kasih.";
}
function speak(text, times) {
  if (!("speechSynthesis" in window)) { show("Browser ini tidak mendukung suara.", "err"); return; }
  const ss = window.speechSynthesis; ss.cancel();
  const v = ss.getVoices().find((x) => /^id/i.test(x.lang));
  for (let i = 0; i < (times || 2); i++) {
    const u = new SpeechSynthesisUtterance(text); u.lang = "id-ID"; if (v) u.voice = v; u.rate = 0.9; ss.speak(u);
  }
}
function announce(o, force) { if (voiceOn || force) { speak(callText(o)); show("🔊 " + callText(o), "ok"); } }
$("btnVoiceTest").onclick = () => speak(callText({ customer_name: "Budi", queue_name: "A-001" }), 1);
