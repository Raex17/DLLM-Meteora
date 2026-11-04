require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId) { console.error('Isi DISCORD_TOKEN dan CLIENT_ID di .env'); process.exit(1); }
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    const body = commands.map((c) => c.toJSON());
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log('✅ Deploy ke Guild berhasil!');
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      console.log('✅ Deploy global berhasil!');
    }
  } catch (err) { console.error('❌ Error:', err.message); }
})();
