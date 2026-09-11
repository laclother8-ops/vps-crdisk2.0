import OpenAI from 'openai';

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model = 'text-embedding-3-small') {
    this.model = model;
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Generates a dense embedding vector (1536 dims) for a given text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Deterministic fallback mock embedding for local/testing environment
      return this.generateMockEmbedding(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.replace(/\n/g, ' ')
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI Embedding API error, falling back to mock embedding:', error);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Computes cosine similarity between two numeric vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateMockEmbedding(text: string): number[] {
    const vector = new Array(1536).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 1536; i++) {
      vector[i] = Math.sin(hash + i) * 0.05;
    }
    return vector;
  }
}
