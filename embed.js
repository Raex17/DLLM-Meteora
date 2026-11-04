// src/embed.js
const { EmbedBuilder } = require('discord.js');

/**
 * Format angka menjadi string yang readable
 */
function formatNumber(value) {
  const num = parseFloat(value || 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

/**
 * Potong alamat untuk tampilan ringkas
 */
function shortAddr(addr) {
  if (!addr) return 'N/A';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * Build embed untuk satu pool
 */
function buildPoolEmbed(pool, index, total) {
  const name = pool.name || `${shortAddr(pool.mint_x)} / ${shortAddr(pool.mint_y)}`;
  const tvl = formatNumber(pool.liquidity);
  const vol24h = formatNumber(pool.trade_volume_24h);
  const fee = pool.base_fee_percentage ? `${pool.base_fee_percentage}%` : 'N/A';
  const binStep = pool.bin_step ?? 'N/A';

  // Warna berdasarkan TVL
  let color = 0x5865f2; // default biru
  const tvlNum = parseFloat(pool.liquidity || 0);
  if (tvlNum >= 100_000) color = 0x00b09b;   // hijau - TVL tinggi
  else if (tvlNum >= 10_000) color = 0xf9c74f; // kuning - TVL medium
  else color = 0xff6b6b;                        // merah - TVL rendah

  const solscanUrl = `https://solscan.io/account/${pool.address}`;
  const meteoraUrl = `https://app.meteora.ag/dlmm/${pool.address}`;

  return new EmbedBuilder()
    .setTitle(`🌊 ${name}`)
    .setColor(color)
    .setURL(meteoraUrl)
    .setDescription(
      `Pool **${index}** dari **${total}** hasil scan\n` +
      `[🔎 Lihat di Meteora](${meteoraUrl}) • [🔍 Solscan](${solscanUrl})`
    )
    .addFields(
      {
        name: '📍 Pool Address',
        value: `\`\`\`${pool.address}\`\`\``,
        inline: false,
      },
      {
        name: '💰 TVL',
        value: tvl,
        inline: true,
      },
      {
        name: '📈 Volume 24h',
        value: vol24h,
        inline: true,
      },
      {
        name: '📊 Bin Step',
        value: `${binStep}`,
        inline: true,
      },
      {
        name: '💸 Base Fee',
        value: fee,
        inline: true,
      },
      {
        name: '🪙 Token X',
        value: `\`${pool.mint_x || 'N/A'}\``,
        inline: false,
      },
      {
        name: '🪙 Token Y',
        value: `\`${pool.mint_y || 'N/A'}\``,
        inline: false,
      }
    )
    .setFooter({ text: `Meteora DLMM Scanner • Pool ${index}/${total}` })
    .setTimestamp();
}

/**
 * Build embed summary (sebelum list pool)
 */
function buildSummaryEmbed(tokenMint, pools) {
  const totalTVL = pools.reduce((sum, p) => sum + parseFloat(p.liquidity || 0), 0);
  const totalVol = pools.reduce((sum, p) => sum + parseFloat(p.trade_volume_24h || 0), 0);

  return new EmbedBuilder()
    .setTitle('🔍 Hasil Scan Meteora DLMM')
    .setColor(0x00b4d8)
    .addFields(
      {
        name: '🪙 Token',
        value: `\`${tokenMint}\``,
        inline: false,
      },
      {
        name: '📦 Total Pool Ditemukan',
        value: `**${pools.length}** pool`,
        inline: true,
      },
      {
        name: '💰 Total TVL',
        value: formatNumber(totalTVL),
        inline: true,
      },
      {
        name: '📈 Total Volume 24h',
        value: formatNumber(totalVol),
        inline: true,
      }
    )
    .setFooter({ text: 'Menampilkan max 5 pool teratas by TVL' })
    .setTimestamp();
}

/**
 * Build embed error
 */
function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setColor(0xff4444)
    .setDescription(message)
    .setTimestamp();
}

module.exports = { buildPoolEmbed, buildSummaryEmbed, buildErrorEmbed };
