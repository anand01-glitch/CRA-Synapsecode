import { EmbeddingProvider } from './embedding-interface';

export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions = 1536;

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const normalizedText = text.toLowerCase();
    const words = normalizedText.match(/\b\w+\b/g) || [];

    // Keyword weight map to ensure semantically related issues cluster closely
    const conceptWeights: Record<string, number[]> = {
      sql: [0, 1, 2, 3, 4, 10, 11, 12],
      injection: [0, 1, 2, 5, 6, 13, 14],
      select: [0, 2, 7, 8, 15, 16],
      where: [1, 3, 7, 9, 17, 18],
      concat: [2, 4, 8, 19, 20],
      concatenate: [2, 4, 8, 19, 20],
      query: [0, 3, 5, 21, 22],
      database: [1, 4, 6, 23, 24],
      parameterized: [0, 2, 5, 25, 26],
      xss: [100, 101, 102, 103, 110],
      innerhtml: [100, 102, 104, 111],
      scripting: [101, 103, 105, 112],
      sanitize: [100, 104, 106, 113],
      test: [200, 201, 202, 203, 210],
      testing: [200, 201, 204, 211],
      coverage: [201, 202, 205, 212],
      duplicate: [300, 301, 302, 303, 310],
      redundant: [300, 302, 304, 311],
      refactor: [301, 303, 305, 312],
      performance: [400, 401, 402, 403, 410],
      loop: [400, 402, 404, 411],
      iteration: [401, 403, 405, 412],
      batch: [400, 404, 406, 413],
    };

    // Apply concept cluster weights
    for (const word of words) {
      if (conceptWeights[word]) {
        for (const idx of conceptWeights[word]) {
          vector[idx] += 3.5;
        }
      }

      // Hash every word into the 1536-dimensional space
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const positiveHash = Math.abs(hash);
      const targetIndex = positiveHash % this.dimensions;
      vector[targetIndex] += 1.0;

      // Small secondary harmonic spread
      const secondaryIndex = (positiveHash * 31) % this.dimensions;
      vector[secondaryIndex] += 0.5;
    }

    // Normalize vector to unit length (L2 norm = 1.0)
    let sumSquares = 0;
    for (let i = 0; i < this.dimensions; i++) {
      sumSquares += vector[i] * vector[i];
    }

    const norm = Math.sqrt(sumSquares);
    if (norm === 0) {
      vector[0] = 1.0;
      return vector;
    }

    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }

    return vector;
  }
}
