import { KnowledgeBaseItem } from '@omnicrm/shared';
import { EmbeddingService } from './embeddings.js';

export interface SearchResult {
  item: KnowledgeBaseItem;
  score: number;
}

export class VectorStoreService {
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
  }

  /**
   * Performs semantic similarity search against knowledge base items
   */
  async searchSimilarChunks(
    query: string,
    items: KnowledgeBaseItem[],
    topK = 3,
    minSimilarity = 0.5
  ): Promise<SearchResult[]> {
    const queryVector = await this.embeddingService.generateEmbedding(query);

    const scored = items
      .map(item => {
        const itemVector = item.embedding || [];
        const score = itemVector.length === queryVector.length 
          ? EmbeddingService.cosineSimilarity(queryVector, itemVector) 
          : 0.8;
        return { item, score };
      })
      .filter(entry => entry.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  /**
   * Builds the SQL fragment for querying PostgreSQL with pgvector extension
   */
  static buildPgVectorQuery(queryEmbedding: number[], category?: string, limit = 4): string {
    const vectorStr = `'[${queryEmbedding.join(',')}]'::vector`;
    const categoryClause = category ? `AND category = '${category}'` : '';
    return `
      SELECT id, title, content, category, 1 - (embedding <=> ${vectorStr}) AS similarity
      FROM knowledge_base
      WHERE 1=1 ${categoryClause}
      ORDER BY embedding <=> ${vectorStr}
      LIMIT ${limit};
    `;
  }
}
