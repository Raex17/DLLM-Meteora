# DLLM Meteora Scanner Bot

Discord bot untuk mendeteksi dan memindai liquidity pool Meteora DLMM di jaringan Solana.

Bot dapat mendeteksi Solana token mint address secara otomatis dari pesan Discord, menampilkan informasi pool, serta memantau kemunculan pool baru.

## Features

- **Auto Token Detection** – Otomatis mendeteksi Solana token mint address dari pesan Discord.
- **Meteora DLMM Scanner** – Mencari pool DLMM berdasarkan token address.
- **Pool Information** – Menampilkan informasi pool, liquidity, bin step, dan fee.
- **Refresh Button** – Memindai ulang token dengan tombol refresh.
- **Token Watcher** – Memantau pool baru selama 1 jam.
- **New Pool Notification** – Mengirim notifikasi ketika pool baru ditemukan.
- **Automatic Monitoring** – Melakukan pengecekan setiap 30 detik.

## Requirements

Pastikan sudah menginstal:

- Node.js 18 atau lebih baru
- npm
- Discord Bot Token
- Discord Server

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Raex17/DLLM-Meteora.git
cd DLLM-Meteora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Buat file `.env` di root project:

```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
```

Ganti `YOUR_DISCORD_BOT_TOKEN` dengan token bot Discord milikmu.

**Important:** Jangan membagikan Discord Bot Token kepada siapa pun. File `.env` tidak boleh di-upload ke GitHub.

### 4. Enable Message Content Intent

Buka [Discord Developer Portal](https://discord.com/developers/applications).

1. Pilih aplikasi Discord Bot.
2. Buka menu Bot.
3. Cari Privileged Gateway Intents.
4. Aktifkan Message Content Intent.
5. Simpan perubahan.

### 5. Invite Bot to Discord Server

Gunakan OAuth2 URL Generator di Discord Developer Portal.

Pilih:
- `bot`
- `Send Messages`
- `Read Message History`
- `Embed Links`
- `Use External Emojis` (opsional)

Pastikan bot memiliki akses membaca dan mengirim pesan pada channel yang digunakan.

### 6. Start the Bot

Jalankan:

```bash
node src/dlmmbot.js
```

Jika berhasil, terminal akan menampilkan:

```text
Bot aktif: YourBotName
```

## Usage

### Automatic Token Scanning

Kirim Solana token mint address ke channel Discord.

Contoh:

```text
So11111111111111111111111111111111111111112
```

Bot akan otomatis mendeteksi address dan mencari pool Meteora DLMM yang berkaitan dengan token tersebut.

### Watch New Pools

Gunakan perintah:

```text
!watch <token_mint_address>
```

Contoh:

```text
!watch So11111111111111111111111111111111111111112
```

Bot akan:
1. Mengambil data pool awal sebagai baseline.
2. Memantau pool setiap 30 detik.
3. Mendeteksi pool baru yang muncul.
4. Mengirim notifikasi jika ditemukan pool baru.
5. Menghentikan pemantauan setelah 1 jam.

Jika tidak ditemukan pool baru, bot akan mengirim pemberitahuan setelah masa pemantauan selesai.

### Refresh Scanner

Gunakan tombol **Refresh** pada hasil scan untuk melakukan pemindaian ulang token yang sama.

## Project Structure

```text
DLLM-Meteora/
├── src/
│   ├── dlmmbot.js
│   └── meteora.js
├── commands.js
├── deploy-commands.js
├── embed.js
├── index.js
├── meteora.js
├── package.json
├── package-lock.json
├── .gitignore
└── .env
```

File `.env` dan folder `node_modules` tidak disertakan dalam repository.

## API

Bot menggunakan Meteora DLMM API untuk mengambil informasi pool.

```text
https://dlmm.datapi.meteora.ag
```

## Important Notes

- Bot harus tetap berjalan agar proses scanning dan monitoring aktif.
- Watch session disimpan di memori dan akan hilang ketika bot direstart.
- Monitoring berjalan setiap 30 detik selama maksimal 1 jam.
- Pastikan Discord Message Content Intent sudah diaktifkan.
- Jangan pernah mengunggah Discord Bot Token ke repository publik.

## License

For educational and development purposes.


edit file `.env` dan isi nilainya:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id   # opsional, untuk testing
```
