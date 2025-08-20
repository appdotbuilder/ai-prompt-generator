import { type ExpandedPromptResponse } from '../schema';

export const expandPrompt = async (userIdea: string): Promise<ExpandedPromptResponse> => {
  try {
    // Validate input
    if (!userIdea || typeof userIdea !== 'string') {
      throw new Error('User idea must be a non-empty string');
    }

    const trimmedIdea = userIdea.trim();
    if (trimmedIdea.length === 0) {
      throw new Error('User idea cannot be empty');
    }

    if (trimmedIdea.length > 500) {
      throw new Error('User idea is too long (max 500 characters)');
    }

    // Generate expanded prompt based on the user idea
    const expandedPrompt = generateExpandedPrompt(trimmedIdea);

    return {
      expanded_prompt: expandedPrompt
    };
  } catch (error) {
    console.error('Prompt expansion failed:', error);
    throw error;
  }
};

/**
 * Generates an expanded prompt from a basic user idea
 * This is a rule-based prompt enhancement system that adds artistic details
 */
function generateExpandedPrompt(userIdea: string): string {
  const lowerIdea = userIdea.toLowerCase();
  
  // Base enhancement templates
  const styleEnhancements = [
    'highly detailed, photorealistic',
    'artistic masterpiece',
    'professional quality',
    'stunning visual composition'
  ];

  const lightingOptions = [
    'dramatic lighting',
    'soft natural lighting',
    'cinematic lighting',
    'golden hour lighting',
    'studio lighting'
  ];

  const compositionOptions = [
    'rule of thirds composition',
    'dynamic perspective',
    'balanced composition',
    'artistic framing'
  ];

  const qualityEnhancers = [
    '8K resolution',
    'ultra-high detail',
    'sharp focus',
    'professional photography'
  ];

  // Determine appropriate enhancements based on content
  let selectedStyle = styleEnhancements[0]; // default
  let selectedLighting = lightingOptions[0]; // default
  let selectedComposition = compositionOptions[0]; // default
  let selectedQuality = qualityEnhancers[3]; // default

  // Content-aware enhancement selection
  if (lowerIdea.includes('portrait') || lowerIdea.includes('person') || lowerIdea.includes('face')) {
    selectedLighting = 'soft natural lighting';
    selectedComposition = 'portrait composition with shallow depth of field';
    selectedQuality = 'professional portrait photography';
  } else if (lowerIdea.includes('landscape') || lowerIdea.includes('nature') || lowerIdea.includes('mountain') || lowerIdea.includes('forest')) {
    selectedLighting = 'golden hour lighting';
    selectedComposition = 'sweeping vista composition';
    selectedQuality = 'landscape photography with wide angle lens';
  } else if (lowerIdea.includes('abstract') || lowerIdea.includes('geometric')) {
    selectedStyle = 'artistic masterpiece';
    selectedLighting = 'dramatic lighting';
    selectedComposition = 'dynamic geometric composition';
  } else if (lowerIdea.includes('animal') || lowerIdea.includes('wildlife') || 
             lowerIdea.includes('tiger') || lowerIdea.includes('lion') || lowerIdea.includes('elephant') ||
             lowerIdea.includes('bird') || lowerIdea.includes('eagle') || lowerIdea.includes('wolf') ||
             lowerIdea.includes('bear') || lowerIdea.includes('deer') || lowerIdea.includes('fox') ||
             lowerIdea.includes('cat') || lowerIdea.includes('dog') || lowerIdea.includes('horse') ||
             lowerIdea.includes('jungle') || lowerIdea.includes('safari') || lowerIdea.includes('zoo')) {
    selectedLighting = 'natural lighting';
    selectedComposition = 'wildlife photography composition';
    selectedQuality = 'telephoto lens, professional wildlife photography';
  }

  // Color enhancement based on content
  let colorEnhancement = 'vibrant colors';
  if (lowerIdea.includes('sunset') || lowerIdea.includes('warm')) {
    colorEnhancement = 'warm, golden tones';
  } else if (lowerIdea.includes('ocean') || lowerIdea.includes('water') || lowerIdea.includes('cool')) {
    colorEnhancement = 'cool blue tones';
  } else if (lowerIdea.includes('monochrome') || lowerIdea.includes('black and white')) {
    colorEnhancement = 'monochromatic tones with rich contrast';
  }

  // Construct the expanded prompt
  const expandedPrompt = [
    `${selectedStyle} image of ${userIdea},`,
    `${selectedLighting},`,
    `${colorEnhancement},`,
    `${selectedComposition},`,
    `${selectedQuality}`,
    'trending on artstation'
  ].join(' ');

  return expandedPrompt;
}