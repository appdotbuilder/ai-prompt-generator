import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { generateImage } from '../handlers/generate_image';

describe('generateImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate an image URL from valid expanded prompt', async () => {
    const expandedPrompt = 'A beautiful sunset over mountains with vibrant colors and dramatic clouds';
    
    const result = await generateImage(expandedPrompt);
    
    expect(result.image_url).toBeDefined();
    expect(typeof result.image_url).toBe('string');
    expect(result.image_url).toMatch(/^https:\/\/ai-generated-images\.example\.com\/\d+-[a-z0-9]+\.jpg$/);
  });

  it('should generate unique URLs for different prompts', async () => {
    const prompt1 = 'A cat sitting in a garden';
    const prompt2 = 'A dog running on the beach';
    
    const result1 = await generateImage(prompt1);
    const result2 = await generateImage(prompt2);
    
    expect(result1.image_url).not.toBe(result2.image_url);
    expect(result1.image_url).toMatch(/^https:\/\/ai-generated-images\.example\.com\//);
    expect(result2.image_url).toMatch(/^https:\/\/ai-generated-images\.example\.com\//);
  });

  it('should handle complex artistic prompts', async () => {
    const complexPrompt = 'A surreal digital painting of a floating city in the clouds, ' +
      'with intricate architecture, golden light filtering through mist, ' +
      'painted in the style of classical romanticism with modern sci-fi elements, ' +
      'highly detailed, 8K resolution, trending on ArtStation';
    
    const result = await generateImage(complexPrompt);
    
    expect(result.image_url).toBeDefined();
    expect(typeof result.image_url).toBe('string');
    expect(result.image_url.length).toBeGreaterThan(0);
  });

  it('should reject empty string prompt', async () => {
    await expect(generateImage('')).rejects.toThrow(/expanded prompt cannot be empty/i);
  });

  it('should reject whitespace-only prompt', async () => {
    await expect(generateImage('   \n\t   ')).rejects.toThrow(/expanded prompt cannot be empty/i);
  });

  it('should reject null prompt', async () => {
    await expect(generateImage(null as any)).rejects.toThrow(/invalid expanded prompt/i);
  });

  it('should reject undefined prompt', async () => {
    await expect(generateImage(undefined as any)).rejects.toThrow(/invalid expanded prompt/i);
  });

  it('should reject non-string prompt', async () => {
    await expect(generateImage(123 as any)).rejects.toThrow(/invalid expanded prompt/i);
    await expect(generateImage({} as any)).rejects.toThrow(/invalid expanded prompt/i);
    await expect(generateImage([] as any)).rejects.toThrow(/invalid expanded prompt/i);
  });

  it('should reject prompts that are too long', async () => {
    const longPrompt = 'A'.repeat(2001); // Exceeds 2000 character limit
    
    await expect(generateImage(longPrompt)).rejects.toThrow(/expanded prompt is too long/i);
  });

  it('should accept prompts at the maximum length limit', async () => {
    const maxLengthPrompt = 'A beautiful landscape with mountains and rivers. '.repeat(40).substring(0, 2000);
    
    const result = await generateImage(maxLengthPrompt);
    
    expect(result.image_url).toBeDefined();
    expect(typeof result.image_url).toBe('string');
  });

  it('should handle prompts with special characters', async () => {
    const promptWithSpecialChars = 'A cyberpunk city at night with neon signs: "東京2077" & @#$%^*()';
    
    const result = await generateImage(promptWithSpecialChars);
    
    expect(result.image_url).toBeDefined();
    expect(typeof result.image_url).toBe('string');
  });

  it('should complete within reasonable time', async () => {
    const startTime = Date.now();
    const prompt = 'A simple test image';
    
    await generateImage(prompt);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 1 second (allowing for some processing overhead)
    expect(duration).toBeLessThan(1000);
  });

  it('should return consistent response structure', async () => {
    const prompt = 'Test prompt for structure validation';
    
    const result = await generateImage(prompt);
    
    expect(result).toHaveProperty('image_url');
    expect(Object.keys(result)).toEqual(['image_url']);
    expect(typeof result.image_url).toBe('string');
  });
});