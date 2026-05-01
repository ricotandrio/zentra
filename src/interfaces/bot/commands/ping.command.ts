import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription("Checks the bot's latency.");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const latency = Date.now() - interaction.createdTimestamp;
  await interaction.reply(`Pong! Latency is ${latency}ms.`);
}
