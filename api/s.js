// api/s.js — FIXED VERSION
const crypto = require('crypto');

function makeToken(secret, w) {
  return crypto.createHmac('sha256', secret).update(w.toString()).digest('hex');
}

function isValidToken(token, secret) {
  if (!token || !secret) return false;
  const now = Math.floor(Date.now() / 30000);
  return [now, now - 1].some(function (w) {
    const expected = makeToken(secret, w);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expected, 'hex')
      );
    } catch (_) { return false; }
  });
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.SOLI_SECRET;
  const token  = req.query.t || '';

  if (!isValidToken(token, secret)) return res.status(403).end();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript');

  const code = `
/* ZXING ULTIMATE SCANNER - SCAN SEMUA QR CODE */
var codeReader = new ZXing.BrowserMultiFormatReader();
var video = document.getElementById("video");
var hasil = document.getElementById("hasil");
var btnStart = document.getElementById("btnStart");
var btnStop = document.getElementById("btnStop");
var fileInput = document.getElementById("fileInput");
var preview = document.getElementById("preview");
var _lastResult = null;
var _scanning = false;

/* ── BEEP SOUND ───────────────────────────────────────────── */
function beep() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.18);
  } catch(e) {}
}

/* ── FLASH EFFECT ─────────────────────────────────────────── */
function flash(el) {
  el.style.transition = 'background 0.1s';
  el.style.background = '#003322';
  setTimeout(function() { el.style.background = '#000'; }, 400);
}

/* ── DISPLAY RESULT ───────────────────────────────────────── */
function tampilkan(text) {
  if (!text || text === _lastResult) return;
  _lastResult = text;
  beep();
  flash(hasil);
  
  var isUrl = /^https?:\\/\\//.test(text);
  var isWiFi = /^WIFI:S:(.+)T:(WPA|WEP|nopass);?I:(.+)?;?P:(.+)?;?/.test(text);
  var isContact = /^BEGIN:VCARD/.test(text);
  var isEvent = /^BEGIN:VEVENT/.test(text);
  
  hasil.innerHTML = 
    '<div style="font-size:11px;color:#555;margin-bottom:6px;letter-spacing:1px;">✅ SCAN SUKSES</div>' +
    '<div style="word-break:break-all;font-size:14px;color:#00ffd0;margin-bottom:12px;padding:8px;background:rgba(0,255,208,0.1);border-radius:6px;border-left:3px solid #00ffd0;">' +
      (isUrl
        ? '<a href="' + text + '" target="_blank" style="color:#00ffd0;text-decoration:none;">🔗 ' + text + '</a>'
        : (isContact ? '👤 Kontak vCard' : 
           isWiFi ? '📶 WiFi Network' : 
           isEvent ? '📅 Event Calendar' : 
           '<span style="color:#fff;">📄 ' + text + '</span>')) +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">' +
      '<button id="btnSalin" onclick="salinHasil()" style="padding:8px 14px;background:#00ffd0;border:none;border-radius:6px;cursor:pointer;font-size:12px;color:#000;font-weight:500;">📋 Salin</button>' +
      (isUrl ? '<a href="' + text + '" target="_blank"><button style="padding:8px 14px;background:#0077ff;border:none;border-radius:6px;cursor:pointer;font-size:12px;color:#fff;">🌐 Buka</button></a>' : '') +
      '<button onclick="resetHasil()" style="padding:8px 14px;background:#222;border:1px solid #333;border-radius:6px;cursor:pointer;font-size:12px;color:#888;">🔄 Reset</button>' +
    '</div>';
}

/* ── COPY TO CLIPBOARD ────────────────────────────────────── */
window.salinHasil = function() {
  if (!_lastResult) return;
  var btn = document.getElementById('btnSalin');
  function ok() {
    if (btn) { 
      btn.innerHTML = '✅ Disalin!'; 
      btn.style.background = '#00aa88'; 
    }
    setTimeout(function() {
      if (btn) { 
        btn.innerHTML = '📋 Salin'; 
        btn.style.background = '#00ffd0'; 
      }
    }, 1800);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(_lastResult).then(ok).catch(ok);
  } else {
    var ta = document.createElement('textarea');
    ta.value = _lastResult; 
    document.body.appendChild(ta);
    ta.select(); 
    document.execCommand('copy'); 
    document.body.removeChild(ta);
    ok();
  }
};

/* ── RESET ────────────────────────────────────────────────── */
window.resetHasil = function() {
  _lastResult = null;
  hasil.innerHTML = '<div style="color:#888;font-size:13px;">📱 Arahkan kamera ke QR Code</div>';
  hasil.style.background = '#000';
};

/* ── START CAMERA (ULTIMATE CONFIG) ───────────────────────── */
window.startCamera = function() {
  if (_scanning) return;
  _scanning = true;

  btnStart.innerHTML = '📹 Scanning...';
  btnStart.style.opacity = '0.6';
  btnStart.disabled = true;
  btnStop.style.display = 'flex';

  // ULTIMATE HINTS - SCAN SEMUA JENIS QR CODE
  codeReader.getVideoInputDevices().then(devices => {
    var hints = {
      // MAX PERFORMANCE
      tryHarder: true,
      formats: [
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.DATA_MATRIX,
        ZXing.BarcodeFormat.AZTEC,
        ZXing.BarcodeFormat.PDF_417,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E
      ]
    };

    codeReader.decodeFromVideoDevice(
      null, 
      video, 
      function(result, err) {
        if (result && result.text) {
          tampilkan(result.text);
        }
      },
      hints
    );
  }).catch(err => {
    console.error('Camera error:', err);
    hasil.innerHTML = '<div style="color:#ff4444;">❌ Kamera tidak bisa diakses</div><div style="color:#888;font-size:11px;margin-top:4px;">Izinkan akses kamera di browser</div>';
  });
};

/* ── STOP CAMERA ──────────────────────────────────────────── */
window.stopCamera = function() {
  if (!_scanning) return;
  
  codeReader.reset();
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  
  _scanning = false;
  btnStart.innerHTML = '🎥 Start Scan';
  btnStart.style.opacity = '1';
  btnStart.disabled = false;
  btnStop.style.display = 'none';
};

/* ── FILE UPLOAD (FIXED) ───────────────────────────────────── */
fileInput.addEventListener("change", function(e) {
  var file = e.target.files[0];
  if (!file) return;
  
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
  
  var reader = new FileReader();
  reader.onload = function() {
    codeReader.decodeFromImage(null, reader.result)
      .then(function(result) {
        if (result.text) {
          tampilkan(result.text);
        } else {
          hasil.innerHTML = '<div style="color:#ffaa00;font-size:13px;">⚠️ QR Code tidak terdeteksi</div><div style="font-size:11px;color:#888;margin-top:6px;">Pastikan gambar jelas dan fokus</div>';
        }
      })
      .catch(function() {
        hasil.innerHTML = '<div style="color:#ff4444;font-size:13px;">❌ Gagal membaca</div><div style="font-size:11px;color:#888;margin-top:6px;">Coba gambar lain</div>';
      });
  };
  reader.readAsDataURL(file);
});

// INIT
window.resetHasil();
`.trim();

  return res.status(200).send(code);
};
