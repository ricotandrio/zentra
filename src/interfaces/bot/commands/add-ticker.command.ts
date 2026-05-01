import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { AddTickerUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';

export const data = new SlashCommandBuilder()
  .setName('add-ticker')
  .setDescription('Add a ticker to the market analysis watchlist')
  .addStringOption((option) =>
    option
      .setName('symbol')
      .setDescription('IDX ticker symbol (e.g., BBCA.JK, BBRI.JK)')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('Company name')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  tickerRepository: ITickerRepository
): Promise<void> {
  const symbol = interaction.options.getString('symbol', true).toUpperCase();
  const name = interaction.options.getString('name', true);

  try {
    const useCase = new AddTickerUseCase(tickerRepository);
    await useCase.execute({ symbol, name });

    await interaction.reply(
      `✅ Successfully added **${symbol}** (${name}) to the watchlist!`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add ticker';
    await interaction.reply({
      content: `❌ ${message}`,
      ephemeral: true,
    });
  }
}
