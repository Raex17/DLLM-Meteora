#!/usr/bin/env node
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { scanMeteoraPools } = require('./meteora');

const token = process.env.DISCORD_TOKEN;
if (!token) { console.error('DISCORD_TOKEN tidak ditemukan'); process.exit(1); }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SOLANA_ADDR_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const WATCH_DURATION_MS = 60 * 60 * 1000; // 1 jam
const WATCH_POLL_MS = 30 * 1000; // poll setiap 30 detik
const watchJobs = new Map(); // key: `${channelId}:${tokenMint}`

function formatNumber(value) {
  const num = parseFloat(value || 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function buildCompactEmbed(tokenMint, pools, requestedBy) {
  if (!pools.length) {
    return new EmbedBuilder()
      .setColor(0xff4444)
      .setDescription(`❌ Tidak ada pool DLMM ditemukan untuk:\n\`${tokenMint}\``);
  }

  // Baris per pool
  const lines = pools.slice(0, 10).map((pool, i) => {
    const name = pool.name || `${pool.mint_x?.slice(0,4)}.../ ${pool.mint_y?.slice(0,4)}...`;
    const liq = formatNumber(pool.liquidity);
    const url = `https://app.meteora.ag/dlmm/${pool.address}`;
    const fee = pool.base_fee_percentage ? `${parseFloat(pool.base_fee_percentage).toFixed(2)}` : 'N/A';
    const bin = pool.bin_step ?? 'N/A';
    const liqIcon = parseFloat(pool.liquidity || 0) > 0 ? '💧' : '🩸';
    return `${i + 1}. [${name} ${bin}/${fee}](${url}) - ${liqIcon} LIQ: \`${liq}\``;
  });

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(
      `**Found ${pools.length} Meteora DLMM for token:**\n` +
      `\`${tokenMint}\`\n\n` +
      lines.join('\n') +
      `\n\n*Requested by ${requestedBy} • <t:${Math.floor(Date.now() / 1000)}:t>*`
    );
}

function buildRefreshButton(tokenMint) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`refresh:${tokenMint}`)
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Success)
  );
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h) return `${h} jam ${m} menit ${s} detik`;
  if (m) return `${m} menit ${s} detik`;
  return `${s} detik`;
}

function buildNewPoolEmbed(job, newPools) {
  const lines = newPools.slice(0, 10).map((pool, i) => {
    const name = pool.name || `${pool.mint_x?.slice(0,4)}.../${pool.mint_y?.slice(0,4)}...`;
    const url = `https://app.meteora.ag/dlmm/${pool.address}`;
    const fee = pool.base_fee_percentage ? parseFloat(pool.base_fee_percentage).toFixed(2) : 'N/A';
    const bin = pool.bin_step ?? 'N/A';
    const liq = formatNumber(pool.liquidity);
    const liqIcon = parseFloat(pool.liquidity || 0) > 0 ? '💧' : '🩸';
    return `${i + 1}. [${name} ${bin}/${fee}](${url}) - ${liqIcon} LIQ: \`${liq}\``;
  });

  return new EmbedBuilder()
    .setColor(0x00b09b)
    .setTitle('🆕 Pool Baru Ditemukan!')
    .setDescription(
      `Token:\n\`${job.tokenMint}\`\n\n` +
      `**${newPools.length}** pool baru ditemukan selama **${formatDuration(Date.now() - job.startedAt)}**.\n\n` +
      lines.join('\n') +
      `\n\n*Di-watch oleh ${job.requestedBy} • <t:${Math.floor(Date.now() / 1000)}:t>*`
    );
}

function buildNoNewPoolEmbed(job, totalPools) {
  return new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle('⏰ Watch Selesai — Tidak Ada Pool Baru')
    .setDescription(
      `Token:\n\`${job.tokenMint}\`\n\n` +
      `Tidak ada pool baru ditemukan selama **1 jam** pemantauan.\n` +
      `Total pool saat ini: **${totalPools}** pool.\n` +
      `\n*Di-watch oleh ${job.requestedBy} • <t:${Math.floor(Date.now() / 1000)}:t>*`
    );
}

function stopWatch(job) {
  if (job.timer) clearInterval(job.timer);
  watchJobs.delete(job.key);
}

async function pollWatch(job) {
  if (job.polling) return;
  job.polling = true;

  try {
    const channel = await client.channels.fetch(job.channelId).catch(() => null);
    if (!channel) {
      stopWatch(job);
      return;
    }

    const pools = await scanMeteoraPools(job.tokenMint);
    const newPools = pools.filter((pool) => pool?.address && !job.baseline.has(pool.address));

    if (newPools.length) {
      stopWatch(job);
      await channel.send({ embeds: [buildNewPoolEmbed(job, newPools)] });
      return;
    }

    if (Date.now() - job.startedAt >= WATCH_DURATION_MS) {
      stopWatch(job);
      await channel.send({ embeds: [buildNoNewPoolEmbed(job, pools.length)] });
    }
  } catch (err) {
    console.error(`[WATCH] Poll error ${job.tokenMint}:`, err.message);
  } finally {
    job.polling = false;
  }
}

async function handleWatchCommand(message) {
  const parts = message.content.trim().split(/\s+/);
  const tokenMint = (parts[1] || '').trim();

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenMint)) {
    return message.reply('⚠️ Format tidak valid!\nGunakan: `!watch <token_mint_address>`');
  }

  const key = `${message.channelId}:${tokenMint}`;
  if (watchJobs.has(key)) {
    const job = watchJobs.get(key);
    const remaining = Math.max(0, WATCH_DURATION_MS - (Date.now() - job.startedAt));
    return message.reply(
      `🔁 Token ini sudah sedang di-watch di channel ini.\n` +
      `Sisa waktu: **${formatDuration(remaining)}**.`
    );
  }

  const loading = await message.reply('🔭 Menyiapkan watch untuk token...');

  try {
    const baselinePools = await scanMeteoraPools(tokenMint);
    const baseline = new Set(baselinePools.map((p) => p.address));

    const job = {
      key,
      channelId: message.channelId,
      guildId: message.guild?.id || null,
      tokenMint,
      requestedBy: message.author.username,
      baseline,
      startedAt: Date.now(),
      timer: null,
      polling: false,
    };
    watchJobs.set(key, job);
    job.timer = setInterval(() => pollWatch(job), WATCH_POLL_MS);

    await loading.edit(
      `✅ **Watch aktif!**\n` +
      `Token: \`${tokenMint}\`\n` +
      `Baseline pool saat ini: **${baseline.size}** pool.\n\n` +
      `Saya akan memantau selama **1 jam**. Jika ada pool baru muncul, saya langsung memberitahu di sini. Jika tidak ada pool baru, saya akan mengabari setelah 1 jam. 👀`
    );
  } catch (err) {
    await loading.edit(`❌ Gagal memulai watch: ${err.message}`);
  }
}

async function doScan(tokenMint, requestedBy) {
  const pools = await scanMeteoraPools(tokenMint);
  const embed = buildCompactEmbed(tokenMint, pools, requestedBy);
  const row = buildRefreshButton(tokenMint);
  return { embeds: [embed], components: [row] };
}

// ─── Auto-detect token dari pesan ───
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  console.log(`[DEBUG] msg from ${message.author.username} in #${message.channel?.name || message.channelId}: ${JSON.stringify(message.content.slice(0,60))}`);

  const content = message.content.trim();

  // ─── !watch command ───
  if (content.startsWith('!watch')) {
    return handleWatchCommand(message);
  }

  const matches = message.content.match(SOLANA_ADDR_REGEX);
  if (!matches) return;

  const tokenMint = matches[0];
  const loading = await message.reply('🔍 Scanning...');

  try {
    const result = await doScan(tokenMint, message.author.username);
    await loading.edit({ content: '', ...result });
  } catch (err) {
    await loading.edit({ content: `❌ Error: ${err.message}` });
  }
});

// ─── Tombol Refresh ───
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('refresh:')) {
    const tokenMint = interaction.customId.replace('refresh:', '');
    await interaction.deferUpdate();

    try {
      const result = await doScan(tokenMint, interaction.user.username);
      await interaction.editReply({ content: '', ...result });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error: ${err.message}`, embeds: [], components: [] });
    }
  }
});

client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  client.user.setActivity('Paste token address untuk scan!', { type: ActivityType.Watching });
});

client.login(token).catch((err) => { console.error('Gagal login:', err.message); process.exit(1); });
