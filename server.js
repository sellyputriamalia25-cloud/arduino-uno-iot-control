require("dotenv/config");
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "ganti-password-ini";
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || "ganti-token-perangkat-yang-panjang";
const sessions = new Set();
let desired = { led: false, relay: false, motor: false };
let reported = { led: false, relay: false, motor: false, online: false, lastSeen: null };
let revision = 0;

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function requireLogin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token)) return res.status(401).json({ error: "Silakan login." });
  next();
}
function requireDevice(req, res, next) {
  if (!safeEqual(req.headers["x-device-token"], DEVICE_TOKEN))
    return res.status(401).json({ error: "Token perangkat tidak valid." });
  next();
}

app.post("/api/login", (req, res) => {
  if (!safeEqual(req.body.password, DASHBOARD_PASSWORD))
    return res.status(401).json({ error: "Password salah." });
  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});
app.post("/api/logout", requireLogin, (req, res) => {
  sessions.delete(req.headers.authorization.replace(/^Bearer\s+/i, ""));
  res.json({ ok: true });
});
app.get("/api/state", requireLogin, (req, res) => {
  const online = reported.lastSeen && Date.now() - reported.lastSeen < 15000;
  res.json({ desired, reported: { ...reported, online: !!online }, revision });
});
app.post("/api/command", requireLogin, (req, res) => {
  const { device, value } = req.body || {};
  if (!["led", "relay", "motor"].includes(device) || typeof value !== "boolean")
    return res.status(400).json({ error: "Perintah tidak valid." });
  desired[device] = value;
  revision++;
  res.json({ ok: true, desired, revision });
});

// ESP8266 polls this endpoint and receives the latest target state.
app.get("/api/device/command", requireDevice, (req, res) => {
  reported.lastSeen = Date.now();
  res.json({ ...desired, revision });
});
// ESP8266 reports the actual output state.
app.post("/api/device/report", requireDevice, (req, res) => {
  const b = req.body || {};
  for (const k of ["led", "relay", "motor"]) {
    if (typeof b[k] === "boolean") reported[k] = b[k];
  }
  reported.lastSeen = Date.now();
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`IoT server running on port ${PORT}`));