const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generate with prompts")
    .addStringOption((option) =>
      option
        .setName("model")
        .setDescription("model to use")
        .setRequired(true)
        .addChoices(
          {
            name: "Anything V4.5",
            value: "anything",
          },
          {
            name: "AOM3",
            value: "aom",
          },
          {
            name: "Counterfeit V2.5",
            value: "counterfeit",
          },
          {
            name: "Nemu",
            value: "nemu",
          }
        )
    )
    .addStringOption((option) =>
      option.setName("positive").setDescription("Positive Prompts")
    )
    .addStringOption((option) =>
      option.setName("negative").setDescription("Negative Prompts")
    )
    .addIntegerOption((option) =>
      option
        .setName("cfg")
        .setDescription("CFG Scale")
        .setMaxValue(20)
        .setMinValue(0)
    )
    .addNumberOption((option) =>
      option
        .setName("denoise")
        .setDescription("Denoise Strength")
        .setMinValue(0)
        .setMaxValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("seed")
        .setDescription("Seed")
        .setMinValue(-1)
        .setMaxValue(2 ^ (32 - 1))
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const model = interaction.options.getString("model") || "anything";
      const prompt = interaction.options.getString("positive") || "";
      const negative_prompt = interaction.options.getString("negative") || "";
      const cfg_scale = interaction.options.getInteger("cfg") || 10;
      const denoising_strength =
        interaction.options.getNumber("denoise") || 0.5;
      const seed = interaction.options.getInteger("seed") || -1;

      const body = JSON.stringify({
        prompt,
        negative_prompt,
        cfg_scale,
        denoising_strength,
        seed,
      });

      const submitRequest = await fetch(
        `https://waifus-api.nemusona.com/job/submit/${model}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body,
        }
      );
      const jobId = await submitRequest.text();
      let status = null;
      while (status !== "completed" && status !== "failed") {
        try {
          await wait(5000);
          const statusRequest = await fetch(
            `https://waifus-api.nemusona.com/job/status/${model}/${jobId}`
          );
          status = await statusRequest.text();
        } catch {}
      }
      if (status !== "completed") throw new Error();
      const resultRequest = await fetch(
        `https://waifus-api.nemusona.com/job/result/${model}/${jobId}`
      );
      if (resultRequest.status !== 200) throw new Error();
      const json = await resultRequest.json();
      const buffer = Buffer.from(json.base64, "base64");
      const attachment = new AttachmentBuilder(buffer, {
        name: `${(json.seed, Math.round(Date.now() / 1e3))}.png`,
      }).setSpoiler(true);
      await interaction.followUp({ files: [attachment] });
    } catch {
      await interaction.followUp("Error");
    }
  },
};
