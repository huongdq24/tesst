
'use server';
/**
 * @fileOverview A Genkit flow for the iGen Architectural AI Assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';
import { Buffer } from 'buffer';

const VoiceArchitecturalAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s spoken query to the iGen Architectural Assistant.'),
  apiKey: z.string().optional().describe('User-specific API key.'),
});
export type VoiceArchitecturalAssistantInput = z.infer<typeof VoiceArchitecturalAssistantInputSchema>;

const VoiceArchitecturalAssistantOutputSchema = z.object({
  responseText: z.string().describe('The textual response from the iGen Architectural Assistant.'),
  responseAudio: z.string().describe('The audio response from the iGen Architectural Assistant, as a data URI.'),
});
export type VoiceArchitecturalAssistantOutput = z.infer<typeof VoiceArchitecturalAssistantOutputSchema>;

const ArchitecturalAssistantPrompt = ai.definePrompt({
  name: 'architecturalAssistantPrompt',
  input: { schema: VoiceArchitecturalAssistantInputSchema },
  output: { schema: z.object({ text: z.string() }) },
  system: `You are iGen, an expert Architectural AI Assistant. Your purpose is to provide helpful, creative, and insightful advice on architectural design principles, material choices, conceptual ideas for projects, sustainability practices, building codes, and other relevant architectural topics.`,
  prompt: `User query: {{{query}}}`,
});

const voiceArchitecturalAssistantFlow = ai.defineFlow(
  {
    name: 'voiceArchitecturalAssistantFlow',
    inputSchema: VoiceArchitecturalAssistantInputSchema,
    outputSchema: VoiceArchitecturalAssistantOutputSchema,
  },
  async (input) => {
    // 1. Get text response
    const { output: llmResponse } = await ArchitecturalAssistantPrompt(input);
    const responseText = llmResponse?.text || "I'm sorry, I couldn't generate a text response.";

    // 2. Convert text response to audio
    let responseAudioUri: string;
    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: responseText,
      });

      if (!media || !media.url) {
        throw new Error('No audio media returned from TTS model.');
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      responseAudioUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    } catch (error) {
      responseAudioUri = 'data:audio/wav;base64,';
    }

    return {
      responseText: responseText,
      responseAudio: responseAudioUri,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function voiceArchitecturalAssistant(input: VoiceArchitecturalAssistantInput): Promise<VoiceArchitecturalAssistantOutput> {
  return voiceArchitecturalAssistantFlow(input);
}
