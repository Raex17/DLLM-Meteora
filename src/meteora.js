const axios = require('axios');

const METEORA_API = 'https://dlmm.datapi.meteora.ag';
const PAGE_SIZE = 1000;
const REQUEST_TIMEOUT = 10000;

function toNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizePool(pool) {
  if (!pool || typeof pool !== 'object') return null;

  const tokenX = pool.token_x && typeof pool.token_x === 'object' ? pool.token_x : {};
  const tokenY = pool.token_y && typeof pool.token_y === 'object' ? pool.token_y : {};
  const volume24h = toNumber(pool.volume?.['24h'] ?? pool.volume?.h24 ?? pool.trade_volume_24h);
  const tvl = toNumber(pool.tvl ?? pool.liquidity);
  const baseFeePct = toNumber(pool.pool_config?.base_fee_pct ?? pool.base_fee_percentage);
  const binStep = pool.pool_config?.bin_step ?? pool.bin_step ?? null;

  return {
    ...pool,
    address: pool.address,
    name: pool.name || [tokenX.symbol, tokenY.symbol].filter(Boolean).join('-'),
    token_x: tokenX,
    token_y: tokenY,
    mint_x: tokenX.address || pool.mint_x || '',
    mint_y: tokenY.address || pool.mint_y || '',
    liquidity: tvl,
    tvl,
    trade_volume_24h: volume24h,
    volume_24h: volume24h,
    base_fee_percentage: baseFeePct,
    bin_step: binStep,
  };
}

async function fetchPoolPage(filterBy, page) {
  const res = await axios.get(`${METEORA_API}/pools`, {
    params: {
      page,
      page_size: PAGE_SIZE,
      sort_by: 'tvl:desc',
      filter_by: filterBy,
    },
    timeout: REQUEST_TIMEOUT,
  });

  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  return {
    rows: rows.map(normalizePool).filter(Boolean),
    pages: toNumber(res.data?.pages),
  };
}

async function fetchPoolsBySide(tokenMint, side) {
  const filterBy = `${side}=${tokenMint}`;
  const allPools = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { rows, pages } = await fetchPoolPage(filterBy, page);
    totalPages = Math.max(pages || 1, 1);
    allPools.push(...rows);
    page += 1;
  } while (page <= totalPages);

  return allPools;
}

/**
 * Scan semua pool DLMM Meteora yang mengandung token tertentu
 * @param {string} tokenMint - Solana token mint address
 * @returns {Array} list of pools
 */
async function scanMeteoraPools(tokenMint) {
  try {
    const [tokenXPools, tokenYPools] = await Promise.all([
      fetchPoolsBySide(tokenMint, 'token_x'),
      fetchPoolsBySide(tokenMint, 'token_y'),
    ]);

    const merged = new Map();
    for (const pool of [...tokenXPools, ...tokenYPools]) {
      if (pool?.address) merged.set(pool.address, pool);
    }

    return [...merged.values()].sort((a, b) => toNumber(b.tvl) - toNumber(a.tvl));
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('[Meteora API Error]', message);
    throw new Error(`Gagal mengambil data dari Meteora API: ${message}`);
  }
}

/**
 * Ambil detail spesifik 1 pool by address
 * @param {string} poolAddress
 */
async function getPoolDetail(poolAddress) {
  try {
    const res = await axios.get(`${METEORA_API}/pools/${poolAddress}`, {
      timeout: REQUEST_TIMEOUT,
    });
    return normalizePool(res.data);
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('[Meteora Pool Detail Error]', message);
    throw new Error(`Gagal mengambil detail pool: ${message}`);
  }
}

module.exports = { scanMeteoraPools, getPoolDetail };
