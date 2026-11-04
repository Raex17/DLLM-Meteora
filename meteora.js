// src/meteora.js
const axios = require('axios');

const METEORA_API = 'https://dlmm-api.meteora.ag';

/**
 * Scan semua pool DLMM Meteora yang mengandung token tertentu
 * @param {string} tokenMint - Solana token mint address
 * @returns {Array} list of pools
 */
async function scanMeteoraPools(tokenMint) {
  try {
    let allPairs = [];
    let page = 1;
    const limit = 100;
    let hasMore = true;

    // Paginate untuk mendapatkan semua pair
    while (hasMore && page <= 5) {
      const res = await axios.get(`${METEORA_API}/pair/all_with_pagination`, {
        params: {
          page,
          limit,
          include_unknown: true,
        },
        timeout: 10000,
      });

      const pairs = res.data?.data || res.data?.pairs || [];

      if (!pairs.length) {
        hasMore = false;
        break;
      }

      allPairs = allPairs.concat(pairs);

      // Cek apakah sudah ketemu token di batch ini
      const found = pairs.filter(
        (p) => p.mint_x === tokenMint || p.mint_y === tokenMint
      );

      // Stop jika sudah cukup data atau tidak ada lagi
      if (pairs.length < limit) hasMore = false;
      page++;
    }

    // Filter pair yang mengandung token
    const filtered = allPairs.filter(
      (pair) => pair.mint_x === tokenMint || pair.mint_y === tokenMint
    );

    // Sort by TVL / liquidity descending
    filtered.sort((a, b) => {
      const tvlA = parseFloat(a.liquidity || 0);
      const tvlB = parseFloat(b.liquidity || 0);
      return tvlB - tvlA;
    });

    return filtered;
  } catch (err) {
    console.error('[Meteora API Error]', err.message);
    throw new Error('Gagal mengambil data dari Meteora API');
  }
}

/**
 * Ambil detail spesifik 1 pool by address
 * @param {string} poolAddress
 */
async function getPoolDetail(poolAddress) {
  try {
    const res = await axios.get(`${METEORA_API}/pair/${poolAddress}`, {
      timeout: 10000,
    });
    return res.data;
  } catch (err) {
    console.error('[Meteora Pool Detail Error]', err.message);
    throw new Error('Gagal mengambil detail pool');
  }
}

module.exports = { scanMeteoraPools, getPoolDetail };
