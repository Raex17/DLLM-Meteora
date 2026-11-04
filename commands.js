// src/commands.js
const { SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Scan pool DLMM Meteora berdasarkan token address')
    .addStringOption((option) =>
      option
        .setName('token')
        .setDescription('Solana token mint address yang ingin di-scan')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Jumlah pool yang ditampilkan (default: 5, max: 10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('pool')
    .setDescription('Lihat detail spesifik satu pool DLMM Meteora')
    .addStringOption((option) =>
      option
        .setName('address')
        .setDescription('Alamat pool DLMM Meteora')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek apakah bot aktif'),
];

module.exports = commands;
