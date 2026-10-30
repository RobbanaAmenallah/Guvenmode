import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Product } from '../../types/index.js';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data: any = await api.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
        setResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectProduct = (slug: string) => {
    onClose();
    navigate(`/produit/${slug}`);
  };

  const handleViewAll = () => {
    onClose();
    navigate(`/boutique?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-guven-border">
        {/* Header Search Input */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-guven-border">
          <Search className="w-5 h-5 text-guven-muted" />
          <input
            type="text"
            placeholder="Rechercher une robe, un ensemble, une matière..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-base sm:text-lg bg-transparent border-none outline-none text-guven-charcoal placeholder:text-guven-muted/60"
          />
          {loading && <Loader2 className="w-5 h-5 text-guven-blue animate-spin" />}
          <button
            onClick={onClose}
            className="p-1.5 text-guven-muted hover:text-guven-charcoal transition-colors rounded-full hover:bg-guven-ivory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {query.trim().length === 0 ? (
            <div className="text-center py-8 text-guven-muted">
              <p className="text-sm">Exemples de recherche populaire :</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['Robe longue', 'Tailleur', 'Soie', 'Bleu Güven', 'Manteau'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 text-xs rounded-full bg-guven-ivory hover:bg-guven-blue hover:text-white transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-guven-muted uppercase tracking-wider mb-2">
                Produits correspondants ({results.length})
              </p>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product.slug)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-guven-ivory cursor-pointer transition-colors group"
                >
                  <img
                    src={product.images[0]?.storage_path}
                    alt={product.name}
                    className="w-14 h-18 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base font-semibold text-guven-charcoal group-hover:text-guven-blue transition-colors truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-guven-muted truncate">
                      {product.category?.name || 'Prêt-à-porter'}
                    </p>
                    <p className="text-sm font-semibold text-guven-blue mt-0.5">
                      {product.base_price.toFixed(3)} DT
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-guven-muted group-hover:text-guven-blue group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              <button
                onClick={handleViewAll}
                className="w-full mt-4 py-3 bg-guven-ivory hover:bg-guven-sand/50 text-guven-charcoal text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
              >
                Voir tous les résultats pour "{query}"
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-guven-muted">
              <p className="text-sm">Aucun produit ne correspond à votre recherche "{query}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
