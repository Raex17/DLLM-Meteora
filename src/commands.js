const { SlashCommandBuilder } = require('discord.js');
const commands = [
  new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Scan pool DLMM Meteora berdasarkan token address')
    .addStringOption((o) => o.setName('token').setDescription('Solana token mint address').setRequired(true))
    .addIntegerOption((o) => o.setName('limit').setDescription('Jumlah pool (max 10)').setMinValue(1).setMaxValue(10)),
  new SlashCommandBuilder()
    .setName('pool')
    .setDescription('Lihat detail pool DLMM Meteora berdasarkan address pool')
    .addStringOption((o) => o.setName('address').setDescription('Alamat pool DLMM').setRequired(true)),
  new SlashCommandBuilder().setName('ping').setDescription('Cek apakah bot aktif'),
];
module.exports = commands;
