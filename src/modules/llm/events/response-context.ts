export type LlmResponseContext =
  | {
      type: 'discord-message';
      channelId: string;
      messageId: string;
      promptLength: number;
    }
  | {
      type: 'discord-interaction';
      applicationId: string;
      interactionToken: string;
      url: string;
    };
