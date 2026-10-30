import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { ProductCard } from '../components/product/ProductCard.js';
import { FilterSidebar } from '../components/product/FilterSidebar.js';
import { Category, Collection, Product } from '../types/index.js';

interface CatalogPageProps {
  mode?: 'all' | 'new' | 'sale';
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ mode = 'all' }) => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states
  const categoryFilter = searchParams.get('category') || (slug && mode === 'all' ? slug : '');
  const collectionFilter = searchParams.get('collection') || '';
  const sizeFilter = searchParams.get('size') || '';
  const colorFilter = searchParams.get('color') || '';
  const inStockFilter = searchParams.get('inStock') === 'true';
  const onSaleFilter = mode === 'sale' || searchParams.get('onSale') === 'true';
  const sortFilter = searchParams.get('sort') || (mode === 'new' ? 'newest' : 'featured');
  const pageFilter = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';

  // Load Categories & Collections
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, cols]: any = await Promise.all([
          api.get('/categories'),
          api.get('/collections')
        ]);
        setCategories(cats || []);
        setCollections(cols || []);
      } catch (err) {
        console.error('Error loading taxonomy:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Products whenever filters change
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();

        if (categoryFilter) queryParams.set('category', categoryFilter);
        if (collectionFilter) queryParams.set('collection', collectionFilter);
        if (sizeFilter) queryParams.set('size', sizeFilter);
        if (colorFilter) queryParams.set('color', colorFilter);
        if (inStockFilter) queryParams.set('inStock', 'true');
        if (onSaleFilter) queryParams.set('onSale', 'true');
        if (sortFilter) queryParams.set('sort', sortFilter);
        if (searchQuery) queryParams.set('search', searchQuery);
        queryParams.set('page', String(pageFilter));
        queryParams.set('limit', '12');

        const res: any = await api.get(`/products?${queryParams.toString()}`);
        setProducts(res.products || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('Error fetching catalog products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryFilter, collectionFilter, sizeFilter, colorFilter, inStockFilter, onSaleFilter, sortFilter, pageFilter, searchQuery]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Determine Title based on current view
  let pageTitle = 'Notre Boutique';
  let pageSubtitle = 'Explorez l\'ensemble de nos créations pour femme.';

  if (mode === 'new') {
    pageTitle = 'Nouveautés';
    pageSubtitle = 'Les dernières pièces et tendances de la saison.';
  } else if (mode === 'sale') {
    pageTitle = 'Offres & Privilèges';
    pageSubtitle = 'Profitez de remises exceptionnelles sur nos pièces sélectionnées.';
  } else if (categoryFilter) {
    const currentCat = categories.find((c) => c.slug === categoryFilter);
    if (currentCat) {
      pageTitle = currentCat.name;
      pageSubtitle = currentCat.description || 'Découvrez notre collection.';
    }
  } else if (collectionFilter) {
    const currentCol = collections.find((c) => c.slug === collectionFilter);
    if (currentCol) {
      pageTitle = currentCol.name;
      pageSubtitle = currentCol.description || 'Collection exclusive.';
    }
  } else if (searchQuery) {
    pageTitle = `Recherche : "${searchQuery}"`;
    pageSubtitle = `${totalCount} résultat(s) trouvé(s).`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Title Section */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-guven-charcoal">
          {pageTitle}
        </h1>
        <p className="text-sm text-guven-muted mt-2 font-light">{pageSubtitle}</p>
      </div>

      {/* Control Bar: Mobile Filter Button + Sort Select */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-guven-border mb-8 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-guven-border text-xs font-semibold uppercase tracking-wider text-guven-charcoal bg-white"
          >
            <SlidersHorizontal className="w-4 h-4 text-guven-blue" />
            <span>Filtres</span>
          </button>
          <span className="text-xs text-guven-muted">
            {totalCount} {totalCount > 1 ? 'pièces trouvées' : 'pièce trouvée'}
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-guven-muted whitespace-nowrap">Trier par :</span>
          <div className="relative">
            <select
              value={sortFilter}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none bg-white border border-guven-border text-xs font-medium text-guven-charcoal py-2 pl-3 pr-8 rounded-xl focus:border-guven-blue focus:outline-none cursor-pointer"
            >
              <option value="featured">Sélection Güven</option>
              <option value="newest">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="popular">Plus populaires</option>
            </select>
            <ChevronDown className="w-4 h-4 text-guven-muted absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <FilterSidebar
            categories={categories}
            collections={collections}
            selectedCategory={categoryFilter}
            onSelectCategory={(cat) => updateParam('category', cat)}
            selectedCollection={collectionFilter}
            onSelectCollection={(col) => updateParam('collection', col)}
            selectedSize={sizeFilter}
            onSelectSize={(sz) => updateParam('size', sz)}
            selectedColor={colorFilter}
            onSelectColor={(col) => updateParam('color', col)}
            inStockOnly={inStockFilter}
            onToggleInStock={(val) => updateParam('inStock', val ? 'true' : '')}
            onSaleOnly={onSaleFilter}
            onToggleOnSale={(val) => updateParam('onSale', val ? 'true' : '')}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Modal/Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex justify-end">
            <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold">Filtres</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-xs uppercase font-semibold text-guven-blue"
                >
                  Fermer
                </button>
              </div>
              <FilterSidebar
                categories={categories}
                collections={collections}
                selectedCategory={categoryFilter}
                onSelectCategory={(cat) => {
                  updateParam('category', cat);
                  setMobileFilterOpen(false);
                }}
                selectedCollection={collectionFilter}
                onSelectCollection={(col) => {
                  updateParam('collection', col);
                  setMobileFilterOpen(false);
                }}
                selectedSize={sizeFilter}
                onSelectSize={(sz) => {
                  updateParam('size', sz);
                  setMobileFilterOpen(false);
                }}
                selectedColor={colorFilter}
                onSelectColor={(col) => {
                  updateParam('color', col);
                  setMobileFilterOpen(false);
                }}
                inStockOnly={inStockFilter}
                onToggleInStock={(val) => updateParam('inStock', val ? 'true' : '')}
                onSaleOnly={onSaleFilter}
                onToggleOnSale={(val) => updateParam('onSale', val ? 'true' : '')}
                onReset={handleResetFilters}
              />
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-guven-muted space-y-3">
              <Loader2 className="w-8 h-8 text-guven-blue animate-spin" />
              <p className="text-xs uppercase tracking-widest font-semibold">
                Chargement des créations...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-guven-border p-8">
              <h3 className="font-serif text-2xl font-bold text-guven-charcoal mb-2">
                Aucun produit ne correspond à vos critères
              </h3>
              <p className="text-sm text-guven-muted max-w-md mx-auto mb-6">
                Essayez d'ajuster ou de réinitialiser vos filtres pour découvrir nos autres créations.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 pt-8 border-t border-guven-border">
                  <button
                    disabled={pageFilter <= 1}
                    onClick={() => updateParam('page', String(pageFilter - 1))}
                    className="px-4 py-2 rounded-xl border border-guven-border text-xs font-semibold text-guven-charcoal disabled:opacity-40 hover:bg-guven-ivory transition-colors"
                  >
                    Page précédente
                  </button>
                  <span className="text-xs text-guven-muted">
                    Page {pageFilter} sur {totalPages}
                  </span>
                  <button
                    disabled={pageFilter >= totalPages}
                    onClick={() => updateParam('page', String(pageFilter + 1))}
                    className="px-4 py-2 rounded-xl border border-guven-border text-xs font-semibold text-guven-charcoal disabled:opacity-40 hover:bg-guven-ivory transition-colors"
                  >
                    Page suivante
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
