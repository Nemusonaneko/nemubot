const { Client, GatewayIntentBits, Events, Collection } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();
const commandPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandPath);

commandFiles.forEach((x) => {
  const filePath = path.join(commandPath, x);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  try {
    if (!command) return;
    await command.execute(interaction);
  } catch {
    console.log(`${interaction.commandName} failed`);
  }
});

client.once(Events.ClientReady, (x) => {
  console.log(`Logged in as: ${x.user.tag}`);
});

client.login(process.env.TOKEN);
