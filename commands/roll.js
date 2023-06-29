const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Random waifu"),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const submitRequest = await fetch(
        `https://waifus-api.nemusona.com/job/submit/anything`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "{}",
        }
      );
      const jobId = await submitRequest.text();
      let status = null;
      while (status !== "completed" && status !== "failed") {
        try {
          await wait(5000);
          const statusRequest = await fetch(
            `https://waifus-api.nemusona.com/job/status/anything/${jobId}`
          );
          status = await statusRequest.text();
        } catch {}
      }
      if (status !== "completed") throw new Error();
      const resultRequest = await fetch(
        `https://waifus-api.nemusona.com/job/result/anything/${jobId}`
      );
      if (resultRequest.status !== 200) throw new Error();
      const json = await resultRequest.json();
      const buffer = Buffer.from(json.base64, "base64");
      const attachment = new AttachmentBuilder(buffer, {
        name: `${(json.seed, Math.round(Date.now() / 1e3))}.png`,
      });
      await interaction.followUp({ files: [attachment] });
    } catch (error) {
      await interaction.followUp("Error");
    }
  },
};
