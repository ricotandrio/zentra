import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription("Checks the bot's latency.");

export async function execute(
  interaction: ChatInputCommandInteraction,
  _tickerRepository?: any,
  _eventBus?: IEventBus
): Promise<void> {
  const latency = Date.now() - interaction.createdTimestamp;
  await interaction.reply(`Pong! Latency is ${latency}ms.`);
}
