export type LlmResponseContext = DiscordInteractionResponseContext | DiscordMessageResponseContext;

type DiscordMessageResponseContext = {
  type: 'discord-message';
  channelId: string;
  messageId: string;
  promptLength: number;
}

type DiscordInteractionResponseContext = {
  type: 'discord-interaction';
  applicationId: string;
  interactionToken: string;
  url: string;
}
