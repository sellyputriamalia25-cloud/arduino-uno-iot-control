# Arduino Uno IoT Control

Website + backend Node.js + NodeMCU ESP8266 bridge + Arduino Uno.

## Hardware
- Arduino Uno
- NodeMCU ESP8266 (bertindak sebagai Wi-Fi bridge)
- Kabel jumper
- Voltage divider untuk jalur Uno D11 (5 V) ke NodeMCU D6 (3.3 V)
- Driver relay / motor yang sesuai. Jangan hubungkan motor langsung ke pin Arduino.

## 1. Jalankan backend lokal
Install Node.js LTS. Di folder proyek:
```bash
npm install
```
Salin `.env.example` menjadi `.env`, lalu ubah `DASHBOARD_PASSWORD` dan `DEVICE_TOKEN`.
```bash
npm start
```
Buka `http://localhost:3000`.

## 2. Hosting agar bisa diakses lewat internet
Deploy folder proyek ini sebagai Node.js web service pada hosting yang mendukung Node.js (misalnya Render atau VPS). Set environment variables:
- `DASHBOARD_PASSWORD`
- `DEVICE_TOKEN`
- `PORT` (biasanya disediakan hosting)

Gunakan URL HTTPS hasil deploy. Server contoh menyimpan status di memori; untuk penggunaan permanen/multi-user, tambahkan database dan autentikasi yang lebih kuat.

## 3. Upload program
- Buka `arduino_uno/arduino_uno.ino` di Arduino IDE, pilih Arduino Uno, upload.
- Buka `esp8266/esp8266_bridge.ino`, install library ArduinoJson, pilih board NodeMCU 1.0 (ESP-12E Module), isi SSID, password Wi-Fi, URL backend, dan device token, lalu upload.

## 4. Wiring serial
- NodeMCU D5 -> Uno D10
- Uno D11 -> voltage divider -> NodeMCU D6
- GND NodeMCU -> GND Uno
- Satukan GND catu daya jika menggunakan supply eksternal.

Uno TX berlogika 5 V sedangkan ESP8266 hanya 3.3 V. Gunakan level shifter atau pembagi tegangan yang benar pada jalur Uno D11 ke NodeMCU D6. Jangan memberi 5 V ke pin ESP8266.

## 5. Catatan keamanan dan penggunaan
- Ubah password dashboard dan token perangkat sebelum dipublikasikan.
- Firmware contoh memakai `setInsecure()` untuk memudahkan uji coba HTTPS. Ini tidak memvalidasi sertifikat server; jangan gunakan untuk sistem produksi tanpa menggantinya dengan verifikasi sertifikat.
- Motor harus melalui driver (misalnya MOSFET/H-bridge) dan catu daya terpisah yang sesuai. Relay harus memakai modul relay yang sesuai.
- Output relay/motor di contoh menggunakan logika HIGH=ON; sesuaikan dengan modul yang digunakan.
- Endpoint backend memakai state dalam memori dan cocok untuk demo/prototipe; server restart akan mengembalikan perintah ke OFF.
