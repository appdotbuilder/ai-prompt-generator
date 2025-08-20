import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { expandPrompt } from '../handlers/expand_prompt';

describe('expandPrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should expand a basic prompt successfully', async () => {
    const userIdea = 'a cat';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toBeDefined();
    expect(typeof result.expanded_prompt).toBe('string');
    expect(result.expanded_prompt.length).toBeGreaterThan(userIdea.length);
    expect(result.expanded_prompt).toContain('a cat');
  });

  it('should enhance portrait-related prompts appropriately', async () => {
    const userIdea = 'portrait of a woman';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toContain('portrait of a woman');
    expect(result.expanded_prompt).toContain('soft natural lighting');
    expect(result.expanded_prompt).toContain('portrait composition');
    expect(result.expanded_prompt).toContain('professional portrait photography');
  });

  it('should enhance landscape prompts appropriately', async () => {
    const userIdea = 'mountain landscape';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toContain('mountain landscape');
    expect(result.expanded_prompt).toContain('golden hour lighting');
    expect(result.expanded_prompt).toContain('sweeping vista');
    expect(result.expanded_prompt).toContain('landscape photography');
  });

  it('should enhance abstract art prompts appropriately', async () => {
    const userIdea = 'abstract geometric shapes';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toContain('abstract geometric shapes');
    expect(result.expanded_prompt).toContain('artistic masterpiece');
    expect(result.expanded_prompt).toContain('dramatic lighting');
    expect(result.expanded_prompt).toContain('dynamic geometric composition');
  });

  it('should enhance animal/wildlife prompts appropriately', async () => {
    const userIdea = 'wild tiger in jungle';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toContain('wild tiger in jungle');
    expect(result.expanded_prompt).toContain('natural lighting');
    expect(result.expanded_prompt).toContain('wildlife photography');
    expect(result.expanded_prompt).toContain('telephoto lens');
  });

  it('should handle color-specific themes correctly', async () => {
    const sunsetIdea = 'sunset over ocean';
    const sunsetResult = await expandPrompt(sunsetIdea);
    expect(sunsetResult.expanded_prompt).toContain('warm, golden tones');

    const oceanIdea = 'deep ocean waves';
    const oceanResult = await expandPrompt(oceanIdea);
    expect(oceanResult.expanded_prompt).toContain('cool blue tones');

    const monoIdea = 'black and white street scene';
    const monoResult = await expandPrompt(monoIdea);
    expect(monoResult.expanded_prompt).toContain('monochromatic tones');
  });

  it('should trim whitespace from input', async () => {
    const userIdea = '  a dog  ';
    const result = await expandPrompt(userIdea);

    expect(result.expanded_prompt).toContain('a dog');
    expect(result.expanded_prompt).not.toContain('  ');
  });

  it('should include quality enhancement keywords', async () => {
    const userIdea = 'a flower';
    const result = await expandPrompt(userIdea);

    // Should contain artistic and quality enhancement terms
    expect(result.expanded_prompt).toMatch(/highly detailed|photorealistic|professional|artistic/i);
    expect(result.expanded_prompt).toContain('trending on artstation');
  });

  it('should reject empty string input', async () => {
    await expect(expandPrompt('')).rejects.toThrow(/empty/i);
  });

  it('should reject whitespace-only input', async () => {
    await expect(expandPrompt('   ')).rejects.toThrow(/empty/i);
  });

  it('should reject null or undefined input', async () => {
    await expect(expandPrompt(null as any)).rejects.toThrow(/non-empty string/i);
    await expect(expandPrompt(undefined as any)).rejects.toThrow(/non-empty string/i);
  });

  it('should reject non-string input', async () => {
    await expect(expandPrompt(123 as any)).rejects.toThrow(/non-empty string/i);
    await expect(expandPrompt({} as any)).rejects.toThrow(/non-empty string/i);
    await expect(expandPrompt([] as any)).rejects.toThrow(/non-empty string/i);
  });

  it('should reject input that is too long', async () => {
    const longInput = 'a'.repeat(501);
    await expect(expandPrompt(longInput)).rejects.toThrow(/too long/i);
  });

  it('should accept input at maximum length', async () => {
    const maxLengthInput = 'a'.repeat(500);
    const result = await expandPrompt(maxLengthInput);

    expect(result.expanded_prompt).toBeDefined();
    expect(result.expanded_prompt).toContain(maxLengthInput);
  });

  it('should generate different enhancements for different content types', async () => {
    const portraitResult = await expandPrompt('person smiling');
    const landscapeResult = await expandPrompt('forest path');
    const abstractResult = await expandPrompt('geometric pattern');

    // Each should have different lighting and composition styles
    expect(portraitResult.expanded_prompt).not.toEqual(landscapeResult.expanded_prompt);
    expect(landscapeResult.expanded_prompt).not.toEqual(abstractResult.expanded_prompt);
    expect(abstractResult.expanded_prompt).not.toEqual(portraitResult.expanded_prompt);

    // But all should contain the original idea
    expect(portraitResult.expanded_prompt).toContain('person smiling');
    expect(landscapeResult.expanded_prompt).toContain('forest path');
    expect(abstractResult.expanded_prompt).toContain('geometric pattern');
  });

  it('should maintain original user idea in expanded prompt', async () => {
    const complexIdea = 'steampunk robot playing violin in Victorian library';
    const result = await expandPrompt(complexIdea);

    expect(result.expanded_prompt).toContain(complexIdea);
    expect(result.expanded_prompt.length).toBeGreaterThan(complexIdea.length * 2);
  });
});