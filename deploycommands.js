const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const commands = [];
const commandPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandPath);

commandFiles.forEach((x) => {
  const filePath = path.join(commandPath, x);
  const command = require(filePath);
  commands.push(command.data.toJSON());
});

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands });
})();
