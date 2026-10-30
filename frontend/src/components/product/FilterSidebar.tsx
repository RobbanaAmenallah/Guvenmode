import React from 'react';
import { Category, Collection } from '../../types/index.js';
import { RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  collections: Collection[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedCollection: string;
  onSelectCollection: (col: string) => void;
  selectedSize: string;
  onSelectSize: (sz: string) => void;
  selectedColor: string;
  onSelectColor: (col: string) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  onSaleOnly: boolean;
  onToggleOnSale: (val: boolean) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  collections,
  selectedCategory,
  onSelectCategory,
  selectedCollection,
  onSelectCollection,
  selectedSize,
  onSelectSize,
  selectedColor,
  onSelectColor,
  inStockOnly,
  onToggleInStock,
  onSaleOnly,
  onToggleOnSale,
  onReset,
}) => {
  const sizes = ['36 (S)', '38 (M)', '40 (L)', '42 (XL)'];
  const colors = [
    { name: 'Bleu Güven', hex: '#1598C8' },
    { name: 'Noir', hex: '#1A1A1A' },
    { name: 'Ivoire', hex: '#FAF8F5' },
    { name: 'Sable', hex: '#E8DDD0' },
    { name: 'Poudre Blush', hex: '#EAD9D8' },
  ];

  const hasActiveFilters =
    selectedCategory ||
    selectedCollection ||
    selectedSize ||
    selectedColor ||
    inStockOnly ||
    onSaleOnly;

  return (
    <div className="w-full space-y-8 bg-white p-6 rounded-2xl border border-guven-border">
      {/* Header with Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-guven-border">
        <h3 className="font-serif text-lg font-bold text-guven-charcoal">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-guven-blue hover:text-guven-blue-deep font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-guven-muted">
          Catégories
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex justify-between items-center ${
              !selectedCategory
                ? 'bg-guven-blue text-white font-semibold'
                : 'text-guven-charcoal hover:bg-guven-ivory'
            }`}
          >
            <span>Toutes les catégories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex justify-between items-center ${
                selectedCategory === cat.slug
                  ? 'bg-guven-blue text-white font-semibold'
                  : 'text-guven-charcoal hover:bg-guven-ivory'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-guven-muted">
            Collections
          </h4>
          <div className="space-y-1.5">
            <button
              onClick={() => onSelectCollection('')}
              className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                !selectedCollection
                  ? 'bg-guven-blue text-white font-semibold'
                  : 'text-guven-charcoal hover:bg-guven-ivory'
              }`}
            >
              Toutes les collections
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => onSelectCollection(col.slug)}
                className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                  selectedCollection === col.slug
                    ? 'bg-guven-blue text-white font-semibold'
                    : 'text-guven-charcoal hover:bg-guven-ivory'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-guven-muted">
          Tailles
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {sizes.map((sz) => (
            <button
              key={sz}
              onClick={() => onSelectSize(selectedSize === sz ? '' : sz)}
              className={`py-2 px-3 text-xs rounded-xl border transition-all text-center ${
                selectedSize === sz
                  ? 'border-guven-blue bg-guven-blue text-white font-semibold shadow-sm'
                  : 'border-guven-border hover:border-guven-blue text-guven-charcoal bg-guven-ivory/50'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-guven-muted">
          Coloris
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelectColor(selectedColor === c.name ? '' : c.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                selectedColor === c.name
                  ? 'border-guven-blue bg-guven-blue/10 text-guven-blue font-semibold'
                  : 'border-guven-border text-guven-charcoal hover:border-guven-blue'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-black/10 inline-block"
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Switches: In stock / On sale */}
      <div className="space-y-3 pt-2 border-t border-guven-border">
        <label className="flex items-center justify-between cursor-pointer py-1">
          <span className="text-xs font-medium text-guven-charcoal">En stock uniquement</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded text-guven-blue focus:ring-guven-blue accent-guven-blue cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer py-1">
          <span className="text-xs font-medium text-guven-charcoal">Offres spéciales uniquement</span>
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => onToggleOnSale(e.target.checked)}
            className="w-4 h-4 rounded text-guven-blue focus:ring-guven-blue accent-guven-blue cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
