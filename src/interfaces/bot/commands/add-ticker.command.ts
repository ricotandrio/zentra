import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { AddTickerUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';
import { IEventBus } from '@/shared/event-bus';

export const data = new SlashCommandBuilder()
  .setName('add-ticker')
  .setDescription('Add a ticker to the market analysis watchlist')
  .addStringOption((option) =>
    option
      .setName('symbol')
      .setDescription('IDX ticker symbol (e.g., BBCA, BMRI)')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  tickerRepository: ITickerRepository,
  eventBus?: IEventBus
): Promise<void> {
  const symbol = interaction.options.getString('symbol', true).toUpperCase();

  try {
    const useCase = new AddTickerUseCase(tickerRepository);

    const normalizedSymbol = symbol.endsWith('.JK') ? symbol : `${symbol}.JK`;

    await useCase.execute({ symbol: normalizedSymbol });

    // Emit ticker added event for other systems to listen to
    if (eventBus) {
      await eventBus.publish({
        type: 'ticker:added',
        source: 'bot',
        timestamp: new Date(),
        data: {
          symbol: normalizedSymbol,
          addedBy: interaction.user.username,
          timestamp: new Date().toISOString(),
        },
      });
    }

    await interaction.reply(
      `✅ Successfully added **${normalizedSymbol}** to the watchlist!`
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
