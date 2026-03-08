
'use server';
/**
 * @fileOverview A Genkit flow for generating a video walkthrough of a building design.
 *
 * - aiVideoWalkthroughGenerator - A function that handles the video generation process.
 * - AIVideoWalkthroughGeneratorInput - The input type for the aiVideoWalkthroughGenerator function.
 * - AIVideoWalkthroughGeneratorOutput - The return type for the aiVideoWalkthroughGenerator function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { MediaPart } from 'genkit';

// Helper to extract MIME type from a data URI
function extractMimeTypeFromDataUri(dataUri: string): string | undefined {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : undefined;
}

const AIVideoWalkthroughGeneratorInputSchema = z
  .object({
    floorPlanDataUri: z
      .string()
      .optional()
      .describe(
        "Optional: A floor plan image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    description: z
      .string()
      .optional()
      .describe(
        'Optional: A detailed text description of the building or scene for the video walkthrough.'
      ),
    cinematicPan: z
      .boolean()
      .default(false)
      .describe('Whether to apply a cinematic pan effect to the video.'),
    aiVideoExtend: z
      .boolean()
      .default(false)
      .describe(
        'Whether to instruct AI for video extension (Veo 3.0 has fixed duration, this acts as a prompt hint).'
      ),
    apiKey: z.string().optional().describe('User-specific API key for AI services.'),
  })
  .superRefine((data, ctx) => {
    if (!data.floorPlanDataUri && !data.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either floorPlanDataUri or description must be provided.',
        path: ['floorPlanDataUri', 'description'],
      });
    }
  });

export type AIVideoWalkthroughGeneratorInput = z.infer<
  typeof AIVideoWalkthroughGeneratorInputSchema
>;

const AIVideoWalkthroughGeneratorOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video walkthrough, as a data URI including MIME type and Base64 encoding. Expected format: 'data:video/mp4;base64,<encoded_data>'."
    ),
});

export type AIVideoWalkthroughGeneratorOutput = z.infer<
  typeof AIVideoWalkthroughGeneratorOutputSchema
>;

/**
 * Fetches a video from a given MediaPart URL and returns it as a base64 encoded data URI.
 * @param video The MediaPart object containing the video URL.
 * @param userKey The optional user-provided API key.
 * @returns A promise that resolves to the base64 encoded video data URI.
 */
async function fetchVideoAsBase64(video: MediaPart, userKey?: string): Promise<string> {
  const apiKey = userKey || process.env.VITE_IGEN_MOTION_API_KEY; // Fallback to server key if user key not provided

  if (!apiKey) {
    throw new Error('API key is not available for video download.');
  }

  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${apiKey}`
  );

  if (!videoDownloadResponse.ok) {
    throw new Error(
      `Failed to fetch video: ${videoDownloadResponse.status} ${videoDownloadResponse.statusText}`
    );
  }

  const arrayBuffer = await videoDownloadResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = video.media?.contentType || 'video/mp4';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function aiVideoWalkthroughGenerator(
  input: AIVideoWalkthroughGeneratorInput
): Promise<AIVideoWalkthroughGeneratorOutput> {
  return aiVideoWalkthroughGeneratorFlow(input);
}

const aiVideoWalkthroughGeneratorFlow = ai.defineFlow(
  {
    name: 'aiVideoWalkthroughGeneratorFlow',
    inputSchema: AIVideoWalkthroughGeneratorInputSchema,
    outputSchema: AIVideoWalkthroughGeneratorOutputSchema,
  },
  async (input) => {
    const promptParts: (string | MediaPart)[] = [];

    if (input.floorPlanDataUri) {
      const mimeType =
        extractMimeTypeFromDataUri(input.floorPlanDataUri) || 'image/jpeg';
      promptParts.push({
        media: { contentType: mimeType, url: input.floorPlanDataUri },
      });
    }

    let textPrompt = `Generate a short video walkthrough of a building design.`;
    if (input.description) {
      textPrompt += ` Based on the following description: ${input.description}.`;
    }
    if (input.cinematicPan) {
      textPrompt += ` Incorporate cinematic pan movements for a dynamic view.`;
    }
    if (input.aiVideoExtend) {
      textPrompt += ` Create a comprehensive and extended walkthrough (up to 8 seconds, as supported).`;
    }
    textPrompt += ` The video should be in a 16:9 aspect ratio.`;

    promptParts.push({ text: textPrompt });

    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: promptParts,
      config: {
        aspectRatio: '16:9',
        personGeneration: 'allow_all',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation');
    }

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(
        `Failed to generate video: ${operation.error.message || 'Unknown error'}`
      );
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video media in the operation output.');
    }

    const videoDataUri = await fetchVideoAsBase64(video, input.apiKey);

    return { videoDataUri };
  }
);
