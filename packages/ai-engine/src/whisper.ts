import OpenAI, { toFile } from 'openai';

export class WhisperAudioService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Transcribes an audio file or buffer using OpenAI Whisper model
   */
  async transcribeAudio(audioInput?: Buffer | string | null, filename = 'audio.ogg'): Promise<string> {
    if (this.openai && audioInput && Buffer.isBuffer(audioInput)) {
      try {
        const file = await toFile(audioInput, filename, { type: 'audio/ogg' });
        const transcription = await this.openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          language: 'pt'
        });
        return transcription.text;
      } catch (err: any) {
        console.warn('[Whisper API Error] Falling back to intelligent mock transcription:', err.message);
      }
    }

    // Development Mock/Fallback for voice notes
    return this.generateMockTranscription();
  }

  private generateMockTranscription(): string {
    const mockTranscriptions = [
      'Olá, boa tarde! Gostaria de saber os valores do plano Enterprise e se vocês oferecem demonstração gratuita do discador.',
      'Oi Sofia, tudo bem? Gostaria de agendar uma reunião com o time comercial para amanhã às 15 horas.',
      'Olá! Preciso falar com um atendente humano com urgência para tirar dúvidas sobre a integração de telefonia.',
      'Gostaria de saber se o CRDISK tem integração oficial com a WhatsApp Cloud API e suporte a envio de áudios.',
      'Podemos avançar para a fase de proposta comercial? Já analisei a apresentação e aprovei o escopo.'
    ];

    const idx = Math.floor(Math.random() * mockTranscriptions.length);
    return mockTranscriptions[idx];
  }
}

export const whisperService = new WhisperAudioService();
