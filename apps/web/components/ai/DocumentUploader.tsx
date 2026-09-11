'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Database, Search, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

interface DocumentUploaderProps {
  onUploaded?: () => void;
}

export function DocumentUploader({ onUploaded }: DocumentUploaderProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PRODUTOS');
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Search tester state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || isUploading) return;

    setIsUploading(true);
    try {
      await api.addKnowledgeBaseItem(title, content, category);
      setSuccess(true);
      setTitle('');
      setContent('');
      if (onUploaded) onUploaded();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to add document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await api.searchKnowledgeBase(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search test failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ingestion Form */}
      <form onSubmit={handleUpload} className="p-4 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Ingerir Novo Documento (RAG Embeddings)
          </h4>
          {success && (
            <span className="text-[11px] font-bold text-primary flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Vetorizado no pgvector (1536d)!
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título: Ex: Tabela de Preços e Prazos.pdf"
              className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-background border border-border focus:border-primary rounded-xl px-2 py-2 text-xs text-foreground outline-none"
          >
            <option value="PRODUTOS">Produtos & Preços</option>
            <option value="TELEFONIA">Telefonia & Discador</option>
            <option value="WHATSAPP">WhatsApp API</option>
            <option value="FAQ">FAQ & Regras</option>
          </select>
        </div>

        <div>
          <textarea
            rows={3}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole o texto ou especificações oficiais da empresa para alimentar a IA..."
            className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !title || !content}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary disabled:opacity-40 text-background font-extrabold text-xs shadow-glow-green flex items-center gap-2 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Gerando Embeddings (text-embedding-3-small)...' : 'Indexar no pgvector'}</span>
          </button>
        </div>
      </form>

      {/* Semantic Cosine Search Tester */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Testador de Busca Semântica (Similaridade de Cosseno)
        </h4>

        <form onSubmit={handleTestSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: Como funciona o discador de chamadas ou quanto custa o plano?"
            className="flex-1 bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 rounded-xl bg-surface-elevated text-primary border border-primary/30 font-bold text-xs hover:bg-primary hover:text-background transition-all"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-1">
            {searchResults.map((res: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground truncate">{res.item?.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    {(res.similarity * 100).toFixed(1)}% similaridade
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {res.item?.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
