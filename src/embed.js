const { EmbedBuilder } = require('discord.js');

function formatNumber(value) {
  const num = parseFloat(value || 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function shortAddr(addr) {
  if (!addr) return 'N/A';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function buildPoolEmbed(pool, index, total) {
  const tokenXSymbol = pool.token_x?.symbol || shortAddr(pool.mint_x);
  const tokenYSymbol = pool.token_y?.symbol || shortAddr(pool.mint_y);
  const name = pool.name || `${tokenXSymbol}/${tokenYSymbol}`;
  const tvlNum = parseFloat((pool.tvl ?? pool.liquidity) || 0);
  const color = tvlNum >= 100_000 ? 0x00b09b : tvlNum >= 10_000 ? 0xf9c74f : 0xff6b6b;

  return new EmbedBuilder()
    .setTitle(`🌊 ${name}`)
    .setColor(color)
    .setURL(`https://app.meteora.ag/dlmm/${pool.address}`)
    .setDescription(`[🔎 Meteora](https://app.meteora.ag/dlmm/${pool.address}) • [🔍 Solscan](https://solscan.io/account/${pool.address})`)
    .addFields(
      { name: '📍 Pool Address', value: `\`${pool.address}\``, inline: false },
      { name: '💰 TVL', value: formatNumber((pool.tvl ?? pool.liquidity) || 0), inline: true },
      { name: '📈 Volume 24h', value: formatNumber((pool.volume_24h ?? pool.trade_volume_24h) || 0), inline: true },
      { name: '📊 Bin Step', value: `${pool.bin_step ?? 'N/A'}`, inline: true },
      { name: '💸 Base Fee', value: pool.base_fee_percentage ? `${pool.base_fee_percentage}%` : 'N/A', inline: true },
      { name: `🪙 Token X (${tokenXSymbol})`, value: `\`${pool.mint_x || 'N/A'}\``, inline: false },
      { name: `🪙 Token Y (${tokenYSymbol})`, value: `\`${pool.mint_y || 'N/A'}\``, inline: false },
    )
    .setFooter({ text: `Meteora DLMM Scanner • Pool ${index}/${total}` })
    .setTimestamp();
}

function buildSummaryEmbed(tokenMint, pools) {
  const totalTVL = pools.reduce((sum, pool) => sum + parseFloat((pool.tvl ?? pool.liquidity) || 0), 0);
  const totalVol = pools.reduce((sum, pool) => sum + parseFloat((pool.volume_24h ?? pool.trade_volume_24h) || 0), 0);

  return new EmbedBuilder()
    .setTitle('🔍 Hasil Scan Meteora DLMM')
    .setColor(0x00b4d8)
    .addFields(
      { name: '🪙 Token', value: `\`${tokenMint}\``, inline: false },
      { name: '📦 Total Pool', value: `**${pools.length}** pool`, inline: true },
      { name: '💰 Total TVL', value: formatNumber(totalTVL), inline: true },
      { name: '📈 Total Volume 24h', value: formatNumber(totalVol), inline: true },
    )
    .setFooter({ text: 'Menampilkan pool teratas by TVL' })
    .setTimestamp();
}

function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setColor(0xff4444)
    .setDescription(message)
    .setTimestamp();
}

module.exports = { buildPoolEmbed, buildSummaryEmbed, buildErrorEmbed };
