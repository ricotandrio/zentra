import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IEventBus } from '@/shared/event-bus';
import { TickerManagementModule } from '@/modules/ticker-management';

export const data = new SlashCommandBuilder()
  .setName('add-ticker')
  .setDescription('Add a ticker to the market analysis watchlist')
  .addStringOption((option) =>
    option
      .setName('symbol')
      .setDescription('Market ticker symbol (e.g., BBCA, BMRI)')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  eventBus?: IEventBus,
  tickerManagementModule?: TickerManagementModule
): Promise<void> {
  const symbol = interaction.options.getString('symbol', true).toUpperCase();

  try {
    const normalizedSymbol = symbol.endsWith('.JK') ? symbol : `${symbol}.JK`;

    await tickerManagementModule?.addTickerUseCase.execute({ symbol: normalizedSymbol });

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
