export interface EmbeddingProvider {
  /**
   * Generates a 1536-dimensional embedding vector for the provided text.
   */
  generateEmbedding(text: string): Promise<number[]>;
}
