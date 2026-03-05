'use server';
/**
 * @fileOverview A Genkit flow for generating architectural design concepts and visual moodboards.
 *
 * - aiDesignConceptGenerator - A function that orchestrates the generation of a design concept and moodboard image.
 * - AIDesignConceptGeneratorInput - The input type for the aiDesignConceptGenerator function.
 * - AIDesignConceptGeneratorOutput - The return type for the aiDesignConceptGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// 1. Define Input Schema
const AIDesignConceptGeneratorInputSchema = z.object({
  designPrompt: z.string().describe('A text prompt describing the desired architectural design vision (e.g., "modern minimalist house in a forest setting").'),
});
export type AIDesignConceptGeneratorInput = z.infer<typeof AIDesignConceptGeneratorInputSchema>;

// 2. Define Output Schema
const AIDesignConceptGeneratorOutputSchema = z.object({
  moodboardImage: z.string().describe('A data URI of the generated visual moodboard image.'),
  designConcept: z.string().describe('The accompanying textual design concept.'),
});
export type AIDesignConceptGeneratorOutput = z.infer<typeof AIDesignConceptGeneratorOutputSchema>;

// 3. Define the prompt for textual design concept generation using 'iGen Logic Engine'
const designConceptTextPrompt = ai.definePrompt({
  name: 'designConceptTextPrompt',
  input: { schema: AIDesignConceptGeneratorInputSchema },
  output: { schema: z.string().describe('A detailed architectural design concept.') },
  prompt: `You are an expert architectural designer. Based on the following design vision, generate a detailed and inspiring architectural design concept. Focus on style, materials, key features, and overall ambiance.

Design Vision: {{{designPrompt}}}

Architectural Design Concept:`, 
  // Using the default model configured in genkit.ts (googleai/gemini-2.5-flash) for 'iGen Logic Engine' functionality
});

// 4. Define the main Genkit flow
const aiDesignConceptGeneratorFlow = ai.defineFlow(
  {
    name: 'aiDesignConceptGeneratorFlow',
    inputSchema: AIDesignConceptGeneratorInputSchema,
    outputSchema: AIDesignConceptGeneratorOutputSchema,
  },
  async (input) => {
    // Generate textual design concept using the defined prompt
    const { output: designConceptResult } = await designConceptTextPrompt(input);
    const designConcept = designConceptResult!;

    // Generate visual moodboard image using 'iGen Vision' (Nano Banana 2 / gemini-2.5-flash-image)
    const { media: imageMedia } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'), // Specifically targeting Nano Banana 2
      prompt: [
        { text: `Create a high-quality visual moodboard image for an architectural design based on this concept: ${input.designPrompt}. Focus on the aesthetic, material palette, and overall atmosphere. The image should be rich in detail and inspiring.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Required for image generation
      },
    });

    if (!imageMedia || !imageMedia.url) {
      throw new Error('Failed to generate moodboard image.');
    }

    return {
      moodboardImage: imageMedia.url,
      designConcept: designConcept,
    };
  }
);

// 5. Export the wrapper function to be called from the client
export async function aiDesignConceptGenerator(input: AIDesignConceptGeneratorInput): Promise<AIDesignConceptGeneratorOutput> {
  return aiDesignConceptGeneratorFlow(input);
}
