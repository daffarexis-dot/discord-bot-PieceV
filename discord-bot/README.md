# HD Music Bot (Discord)

Bot Discord dengan 2 fitur:
- 🎵 **Musik** — putar audio dari link langsung atau file upload (BUKAN dari YouTube/TikTok — lihat catatan di bawah)
- 🖼️ **Upscale foto & video** — pertajam kualitas gambar/video pendek pakai AI (Real-ESRGAN via Replicate)

## Setup

### Langkah 1 — Siapkan token (wajib, apapun cara hosting-nya nanti)

1. Buat bot Discord di https://discord.com/developers/applications :
   - New Application → kasih nama
   - Tab **Bot** → Reset Token → copy token-nya (ini `DISCORD_TOKEN`)
   - Tab **General Information** → copy **Application ID** (ini `CLIENT_ID`)
   - Masih di tab **Bot** → scroll ke **Privileged Gateway Intents** → nyalakan **Message Content Intent** (wajib buat command prefix `p...`, lihat penjelasan di bawah) → Save Changes
   - Di tab **OAuth2 → URL Generator**: centang `bot` + `applications.commands`, lalu di permissions centang `Connect`, `Speak`, `Send Messages`, `Attach Files`. Buka link yang dihasilkan untuk invite bot ke server kamu.
2. Buat akun di https://replicate.com, ambil API token di https://replicate.com/account/api-tokens (ini `REPLICATE_API_TOKEN`)
3. Buka halaman model https://replicate.com/nightmareai/real-esrgan → tab **API** → copy version ID model-nya (ini `REPLICATE_UPSCALE_MODEL_VERSION`)

Simpan 4 nilai di atas, dipakai di kedua opsi di bawah.

### Langkah 2 — Pilih cara menjalankan bot-nya

### Opsi A — Tanpa install apapun di laptop (deploy lewat Railway)

1. Buat akun di https://github.com (kalau belum punya).
2. Extract file zip ini di laptop kamu (cukup di-extract, tidak perlu dibuka pakai apapun).
3. Di GitHub, klik **New repository** → kasih nama (misal `discord-bot`) → Create.
4. Di halaman repo yang baru dibuat, klik **uploading an existing file**, lalu drag & drop SEMUA isi folder hasil extract tadi (termasuk folder `commands` dan `utils`) → Commit changes.
5. Buat akun di https://railway.app, sign in pakai akun GitHub kamu.
6. **New Project** → **Deploy from GitHub repo** → pilih repo yang tadi kamu upload.
7. Railway otomatis mendeteksi ini project Node.js dan akan install + jalankan sendiri — tidak perlu install apapun.
8. Buka tab **Variables** di project Railway itu, tambahkan 4 variable dari Langkah 1 tadi:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `REPLICATE_API_TOKEN`
   - `REPLICATE_UPSCALE_MODEL_VERSION`
   
   Opsional (buat fitur command prefix `p...`, lihat bagian bawah README):
   - `PREFIX` (default `p` kalau tidak diisi)
9. Railway otomatis redeploy setelah variable disimpan. Cek tab **Deployments** → **View Logs**, tunggu sampai muncul `Bot online sebagai ...` — kalau sudah muncul itu tandanya bot sudah nyala 24/7.

Catatan: Railway punya free trial credit, setelah habis butuh langganan (mulai ~$5/bulan). Kalau mau, saya bisa bandingkan opsi hosting lain juga.

### Opsi B — Jalanin sendiri lewat Node.js di laptop

1. **Install Node.js** (versi 18+) kalau belum ada.
2. Di folder ini, jalankan:
   ```
   npm install
   ```
3. Copy `.env.example` jadi `.env`, isi 4 value dari Langkah 1 tadi.
4. Daftarkan slash command ke Discord:
   ```
   npm run register

   ```
8. Jalankan bot:
   ```
   npm start
   ```

## Command yang tersedia

| Command | Fungsi |
|---|---|
| `/play url:<link>` atau `/play file:<upload>` | Putar audio, otomatis masuk antrian kalau sudah ada yang main |
| `/pause` / `/resume` | Jeda / lanjutkan |
| `/skip` | Lewati ke lagu berikutnya |
| `/stop` | Berhenti total, keluar voice channel |
| `/queue` | Lihat antrian |
| `/upscale image:<upload>` | Perbesar & pertajam foto |
| `/upscale-video video:<upload>` | Perbesar & pertajam video pendek (maks 6 detik, bisa diubah di `commands/upscalevideo.js`) |
| `/balance [user]` | Cek saldo Rp |
| `/daily` | Klaim Rp harian: **Rp 100.000**, naik **kelipatan x2 tiap 7 hari streak** berturut-turut (harus klaim tiap hari, jangan sampai lewat 48 jam atau streak reset). Ini streak klaim, terpisah dari badge (lihat bawah). |
| `/work` | Kerja buat Rp 10.000 - Rp 50.000 (cooldown 30 menit) |
| `/mancing` | Kerja sampingan tambahan buat Rp 15.000 - Rp 70.000 (cooldown 45 menit, terpisah dari `/work` — jadi bisa diselang-seling biar dapat lebih banyak). Ada 15% kemungkinan gagal. |
| `/give user:<@user> jumlah:<n>` | Kasih Rp ke user lain (dipotong dari saldo kamu) |
| `/leaderboard` | Top 10 saldo Rp terbanyak di server, badge streak ngobrol tiap user juga ditampilkan |
| `/coinflip bet:<n> pilihan:<heads/tails>` | Tebak koin, menang x2 |
| `/slots bet:<n>` | Slot machine dengan animasi spin — reel-nya berhenti satu-satu (kiri → tengah → kanan) biar kelihatan bergerak (3 sama = jackpot, 2 sama = x1.5). **Maks taruhan Rp100.000.** |
| `/blackjack bet:<n>` | Blackjack lawan bot, ada tombol Hit/Stand |
| `/berburu` | Kerja sampingan: berburu di hutan buat Rp 20.000 - Rp 100.000 (cooldown 40 menit, animasi 3 tahap). 20% kemungkinan gagal. |
| `/nambang` | Kerja sampingan: nambang di gua buat Rp 30.000 - Rp 160.000 (cooldown 60 menit — paling lama tapi reward paling gede, animasi 3 tahap). 20% kemungkinan gagal. |
| `/aksi tipe:<jenis> user:<@user>` | Command aksi/roleplay: hug, kiss, pat, cuddle, slap, punch, kick, bite, poke, tickle, high five, wave, wink, lick, kill (bercanda), bonk, yeet, smug — GIF diambil otomatis dari API anime (nekos.best / waifu.pics). Semua ada versi prefix-nya juga, lihat tabel di bawah. |
| `/help` | Tampilkan daftar semua command (embed, otomatis nambah section "Owner" kalau kamu punya akses `/addmoney`) |
| `/addmoney user:<@user> jumlah:<n>` | **Khusus owner bot** — tambah atau kurangi saldo Rp seorang user langsung (isi jumlah minus buat mengurangi). Secara default cuma Discord ID `726779204116676648` yang bisa pakai ini, bisa ditambah lewat env `OWNER_IDS` (lihat `.env.example`). |

## Command cepat pakai prefix (`p...`)

Biar tidak perlu ketik `/` terus milih dari menu, sekarang ada juga command singkat berupa **pesan biasa** yang diawali huruf `p` (bisa diganti lewat env `PREFIX`). Contoh paling sering dipakai — main slot tinggal ketik salah satu:

```
ps 20000
pslot 20k
```

Daftar lengkap alias-nya:

| Alias | Sama seperti | Contoh |
|---|---|---|
| `ps` / `pslot` / `pslots` | `/slots` | `pslot 50k` (maks Rp100.000) |
| `pb` / `pbal` / `pbalance` / `psaldo` | `/balance` | `pbal` atau `pbal @user` |
| `pd` / `pdaily` | `/daily` | `pdaily` |
| `pw` / `pwork` / `pkerja` | `/work` | `pwork` |
| `pm` / `pmancing` | `/mancing` | `pmancing` |
| `pg` / `pgive` / `pkasih` | `/give` | `pgive @user 20k` |
| `pl` / `plb` / `pleaderboard` / `ptop` | `/leaderboard` | `ptop` |
| `pburu` / `pberburu` | `/berburu` | `pburu` |
| `pnambang` / `ptambang` | `/nambang` | `pnambang` |
| `paddmoney` / `padd` / `ptambahsaldo` | `/addmoney` | `paddmoney @Budi 500k` (khusus owner) |
| `phelp` / `pmenu` | `/help` | tampilkan daftar command prefix di atas (embed) |

Catatan: jumlah Rp boleh ditulis singkat, `20k`/`20rb` = Rp20.000, `1.5jt`/`1.5juta` = Rp1.500.000. Command yang butuh pilihan presisi (coinflip, blackjack) atau upload file (upscale, play) tetap pakai slash command `/` biasa.

### Command aksi / roleplay (`phug`, `plick`, `pkill`, `ppunch`, dll)

Ketik salah satu alias di bawah + mention orangnya, bot bakal balas embed berisi GIF anime yang sesuai (diambil otomatis dari API `nekos.best` / `waifu.pics`, gratis & SFW):

| Alias | Aksi | Contoh |
|---|---|---|
| `phug` | 🤗 Hug | `phug @Budi` |
| `pkiss` | 😘 Kiss | `pkiss @Budi` |
| `ppat` | 🤚 Pat | `ppat @Budi` |
| `pcuddle` | 🥰 Cuddle | `pcuddle @Budi` |
| `pslap` | ✋ Slap | `pslap @Budi` |
| `ppunch` | 👊 Punch | `ppunch @Budi` |
| `pkick` | 🦵 Kick | `pkick @Budi` |
| `pbite` | 😬 Bite | `pbite @Budi` |
| `ppoke` | 👉 Poke | `ppoke @Budi` |
| `ptickle` | 🤣 Tickle | `ptickle @Budi` |
| `phighfive` / `ptos` | 🙌 High Five | `ptos @Budi` |
| `pwave` | 👋 Wave | `pwave @Budi` |
| `pwink` | 😉 Wink | `pwink @Budi` |
| `plick` | 👅 Lick | `plick @Budi` |
| `pkill` | 🔪 Kill (bercanda) | `pkill @Budi` |
| `pbonk` | 🔨 Bonk | `pbonk @Budi` |
| `pyeet` | 🚀 Yeet | `pyeet @Budi` |
| `psmug` | 😏 Smug | `psmug @Budi` |

Semua aksi ini juga tersedia lewat satu slash command `/aksi tipe:<jenis> user:<@user>` kalau lebih suka pakai menu `/`. Mau nambah aksi baru? Tinggal tambah 1 entry di `utils/actionsData.js`, otomatis muncul di prefix, `/aksi`, dan `/help`.

### Command owner (`paddmoney` / `/addmoney`)

Discord ID **`726779204116676648`** otomatis punya akses ke command khusus owner buat nambah (atau ngurangin) saldo Rp siapa aja di server, tanpa perlu lewat `/give` atau nunggu cooldown kerja:

```
paddmoney @Budi 500k        -> nambah Rp500.000 ke saldo Budi
paddmoney 1jt                -> nambah Rp1.000.000 ke saldo sendiri
paddmoney @Budi -200k        -> ngurangin Rp200.000 dari saldo Budi
```

Kalau mau kasih akses yang sama ke Discord ID lain, tambahkan di env `OWNER_IDS` (pisahkan pakai koma) — lihat `.env.example`.

**Penting — wajib diaktifkan biar command prefix jalan:** buka https://discord.com/developers/applications → pilih aplikasi bot kamu → tab **Bot** → scroll ke **Privileged Gateway Intents** → nyalakan toggle **Message Content Intent** → Save Changes. Kalau ini tidak dinyalakan, bot tidak bisa baca isi pesan sama sekali sehingga command prefix (`ps`, `pdaily`, dst) tidak akan merespons — tapi slash command (`/slots`, dst) tetap jalan normal tanpa ini.

## Badge streak ngobrol

Badge ini **bukan** dari command `/daily` — cukup **kirim pesan apa aja, di channel manapun** di server, tiap hari, biar streak-mu jalan otomatis (tidak perlu command khusus). Bot ngecek tiap ada pesan masuk:

- Pesan lain di hari yang sama → tidak ngaruh (streak cuma nambah 1x per hari).
- Kirim pesan lagi besoknya (dalam 48 jam sejak hitungan terakhir) → streak +1.
- Kelewat 48 jam tanpa kirim pesan sama sekali → streak reset ke 1.

Begitu naik tingkat, bot otomatis kirim pengumuman badge baru di channel tempat kamu ngobrol. Badge & streak-nya bisa dicek juga lewat `/balance` dan `/leaderboard`:

| Badge | Nama | Minimal streak ngobrol |
|---|---|---|
| 🔥 | Streak Awal | 3 hari |
| ⚡ | Streak Tangguh | 7 hari |
| 🌟 | Streak Master | 14 hari |
| 👑 | Streak Legend | 30 hari |
| 💎 | Streak Dewa | 60 hari |

## Catatan soal sistem ekonomi (`/balance`, `/daily`, dll)

Data saldo disimpan di file `economy-data.json` pakai `fs` biasa (tanpa database eksternal, biar setup tetap simpel). Konsekuensinya:
- **Kalau kamu redeploy di Railway, data ini KEMUNGKINAN BESAR RESET** — filesystem Railway itu sementara (ephemeral), file yang dibuat saat runtime tidak ikut ke-deploy ulang.
- Kalau mau data ekonomi permanen, tambahkan **Volume** di Railway (Settings → Volumes → Add Volume, mount ke path misal `/data`), lalu di tab Variables tambahkan `ECONOMY_DATA_PATH` dengan value `/data/economy-data.json`.
- Koin di sini murni virtual buat seru-seruan, tidak ada nilai uang asli dan tidak bisa dicairkan.

## Kenapa `/play` tidak menerima link YouTube/TikTok?

Sengaja tidak dibuatkan. Bot yang mengambil audio dari YouTube/TikTok biasanya melanggar Terms of Service platform tersebut (scraping/download konten), dan kalau lagunya berhak cipta, itu masalah pelanggaran hak cipta juga. `/play` di bot ini murni menerima **link audio langsung** (URL yang berakhir file audio, atau hasil upload sendiri) — jadi cocok untuk musik milik sendiri, royalty-free, atau lisensi yang memang boleh kamu putar ulang.

## Catatan soal `/upscale-video`

Upscale video itu berat — prosesnya: extract tiap frame → upscale satu-satu lewat AI → gabung ulang jadi video. Karena itu:
- Dibatasi maksimal **6 detik** per video (bisa diubah di `MAX_DURATION_SEC`, tapi makin lama makin lambat & makin mahal biaya API Replicate-nya)
- Frame diambil di **8 fps** (bisa diubah di `EXTRACT_FPS`) supaya jumlah frame yang diproses tidak meledak
- Bisa makan waktu beberapa menit tergantung panjang video
- Hasil video harus di bawah 8MB untuk bisa dikirim balik ke Discord (limit bot biasa)

## Biaya

Replicate API berbayar per pemakaian (bukan gratis unlimited) — cek pricing di https://replicate.com/pricing sebelum dipakai rame-rame, terutama untuk `/upscale-video` yang manggil API berkali-kali (satu kali per frame).
