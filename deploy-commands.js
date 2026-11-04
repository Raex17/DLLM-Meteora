// src/deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ DISCORD_TOKEN dan CLIENT_ID wajib diisi di .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    const commandsJSON = commands.map((cmd) => cmd.toJSON());

    if (guildId) {
      // Deploy ke 1 server (lebih cepat, cocok untuk testing)
      console.log(`🚀 Mendeploy ${commandsJSON.length} command ke Guild: ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsJSON,
      });
      console.log('✅ Slash commands berhasil di-deploy ke Guild!');
    } else {
      // Deploy global (butuh ~1 jam propagasi)
      console.log(`🚀 Mendeploy ${commandsJSON.length} command secara global...`);
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandsJSON,
      });
      console.log('✅ Slash commands berhasil di-deploy secara global!');
    }
  } catch (err) {
    console.error('❌ Gagal deploy commands:', err);
  }
})();
