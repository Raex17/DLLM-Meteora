// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { scanMeteoraPools, getPoolDetail } = require('./meteora');
const { buildPoolEmbed, buildSummaryEmbed, buildErrorEmbed } = require('./embed');

// ================================
// Validasi environment variables
// ================================
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN tidak ditemukan di .env');
  process.exit(1);
}

// ================================
// Inisialisasi Discord Client
// ================================
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ================================
// Event: Bot Ready
// ================================
client.once('ready', () => {
  console.log(`✅ Bot aktif sebagai: ${client.user.tag}`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server`);

  client.user.setActivity('Meteora DLMM | /scan', {
    type: ActivityType.Watching,
  });
});

// ================================
// Event: Slash Command Handler
// ================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ─── /ping ────────────────────────────────────────
  if (commandName === 'ping') {
    const latency = Date.now() - interaction.createdTimestamp;
    return interaction.reply({
      content: `🏓 Pong! Latency: **${latency}ms** | API: **${client.ws.ping}ms**`,
      ephemeral: true,
    });
  }

  // ─── /scan <token> ────────────────────────────────
  if (commandName === 'scan') {
    const tokenMint = interaction.options.getString('token').trim();
    const limit = interaction.options.getInteger('limit') ?? 5;

    // Validasi format Solana address (base58, 32-44 karakter)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenMint)) {
      return interaction.reply({
        embeds: [buildErrorEmbed('❌ Format token address tidak valid!\nPastikan kamu memasukkan Solana mint address yang benar.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      console.log(`[SCAN] Token: ${tokenMint} oleh ${interaction.user.tag}`);

      const pools = await scanMeteoraPools(tokenMint);

      if (!pools.length) {
        return interaction.editReply({
          embeds: [
            buildErrorEmbed(
              `Tidak ada pool DLMM Meteora ditemukan untuk token:\n\`${tokenMint}\`\n\n` +
              `Pastikan address benar atau token ini belum memiliki pool di Meteora.`
            ),
          ],
        });
      }

      // Ambil max sesuai limit
      const displayPools = pools.slice(0, limit);

      // Kirim summary embed pertama
      const summaryEmbed = buildSummaryEmbed(tokenMint, pools);

      // Buat embed untuk setiap pool
      const poolEmbeds = displayPools.map((pool, i) =>
        buildPoolEmbed(pool, i + 1, displayPools.length)
      );

      // Discord max 10 embeds per message
      await interaction.editReply({
        embeds: [summaryEmbed, ...poolEmbeds],
      });

      console.log(`[SCAN] Berhasil — ${pools.length} pool ditemukan, tampil ${displayPools.length}`);
    } catch (err) {
      console.error('[SCAN ERROR]', err.message);
      return interaction.editReply({
        embeds: [buildErrorEmbed(`Terjadi error saat scan:\n\`${err.message}\``)],
      });
    }
  }

  // ─── /pool <address> ──────────────────────────────
  if (commandName === 'pool') {
    const poolAddress = interaction.options.getString('address').trim();

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(poolAddress)) {
      return interaction.reply({
        embeds: [buildErrorEmbed('❌ Format pool address tidak valid!')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      console.log(`[POOL] Address: ${poolAddress} oleh ${interaction.user.tag}`);

      const pool = await getPoolDetail(poolAddress);

      if (!pool) {
        return interaction.editReply({
          embeds: [buildErrorEmbed(`Pool tidak ditemukan:\n\`${poolAddress}\``)],
        });
      }

      const embed = buildPoolEmbed(pool, 1, 1);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[POOL ERROR]', err.message);
      return interaction.editReply({
        embeds: [buildErrorEmbed(`Terjadi error:\n\`${err.message}\``)],
      });
    }
  }
});

// ================================
// Login Bot
// ================================
client.login(token).catch((err) => {
  console.error('❌ Gagal login bot:', err.message);
  process.exit(1);
});
