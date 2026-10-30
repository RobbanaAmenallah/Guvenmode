import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, ShoppingBag, ShieldCheck, Truck, RefreshCw, 
  Ruler, Check, AlertCircle, ChevronRight, ZoomIn, X, Loader2, Video, Play,
  Volume2, VolumeX, Pause, Image as ImageIcon
} from 'lucide-react';
import { api } from '../api/client.js';
import { Product, ProductVariant } from '../types/index.js';
import { useCartStore } from '../stores/useCartStore.js';
import { useWishlistStore } from '../stores/useWishlistStore.js';
import { ProductCard } from '../components/product/ProductCard.js';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'care' | 'delivery'>('details');

  const addItem = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      try {
        setLoading(true);
        const data: Product = await api.get(`/products/${slug}`);
        setProduct(data);

        // Auto-launch video if present on the product
        if (data.video_url) {
          setShowVideo(true);
          setIsPlaying(true);
        } else {
          setShowVideo(false);
        }

        // Pre-select first color and size
        if (data.variants && data.variants.length > 0) {
          setSelectedColor(data.variants[0].color_name);
          setSelectedSize(data.variants[0].size_label);
        }

        // Fetch related products
        const rel: any = await api.get(`/products?category=${data.category?.slug || ''}&limit=4`);
        setRelatedProducts((rel.products || []).filter((p: Product) => p.id !== data.id));
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Autoplay handler with fallback
  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Enforce muted autoplay policy
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [showVideo, product?.video_url]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-guven-muted space-y-3">
        <Loader2 className="w-8 h-8 text-guven-blue animate-spin" />
        <p className="text-xs uppercase tracking-widest font-semibold">Chargement de la pièce...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-3xl font-bold text-guven-charcoal">Pièce Introuvable</h2>
        <p className="text-sm text-guven-muted mt-2 mb-6">
          Le produit recherché n'est plus disponible ou a été déplacé.
        </p>
        <Link
          to="/boutique"
          className="inline-flex px-8 py-3 bg-guven-blue text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  // Find selected variant
  const selectedVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color_name === selectedColor && v.size_label === selectedSize
  );

  const availableStock = selectedVariant?.inventory
    ? selectedVariant.inventory.quantity_on_hand - selectedVariant.inventory.quantity_reserved
    : 0;

  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  // Extract unique colors & sizes
  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.color_name, v])).values()
  );
  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size_label)));

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
  };

  const isFavorited = isInWishlist(product.id);
  const images = product.images.length > 0 ? product.images : [{ storage_path: '', alt_text: '' }];

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-guven-muted mb-8">
        <Link to="/" className="hover:text-guven-blue transition-colors">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/boutique" className="hover:text-guven-blue transition-colors">Boutique</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/categories/${product.category.slug}`} className="hover:text-guven-blue transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-guven-charcoal font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {(images.length > 1 || product.video_url) && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px] flex-shrink-0">
              {product.video_url && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`w-16 h-20 sm:w-20 sm:h-26 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-guven-charcoal text-white flex flex-col items-center justify-center gap-1 ${
                    showVideo
                      ? 'border-guven-blue shadow-md ring-2 ring-guven-blue/30'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title="Voir la vidéo du modèle"
                >
                  <div className="w-8 h-8 rounded-full bg-guven-blue/80 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Vidéo</span>
                </button>
              )}
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShowVideo(false);
                    setActiveImgIndex(idx);
                  }}
                  className={`w-16 h-20 sm:w-20 sm:h-26 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-guven-ivory ${
                    !showVideo && activeImgIndex === idx
                      ? 'border-guven-blue shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.storage_path}
                    alt={img.alt_text || product.name}
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Visual */}
          <div className="relative flex-1 aspect-[3/4] rounded-3xl overflow-hidden bg-guven-ivory border border-guven-border shadow-luxury">
            {showVideo && product.video_url ? (
              <div className="relative w-full h-full bg-black group">
                <video
                  ref={videoRef}
                  src={product.video_url}
                  poster={images[0]?.storage_path}
                  preload="metadata"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  disablePictureInPicture
                  controlsList="nodownload"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-cover object-center cursor-pointer"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                />

                {/* Video Top Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                  <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-lg border border-white/10 pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Vidéo Haute Définition</span>
                  </span>
                  {hasDiscount && (
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-guven-blue text-white rounded-full shadow-sm pointer-events-auto">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {/* Quick Switch to Photos Button */}
                <button
                  type="button"
                  onClick={() => setShowVideo(false)}
                  className="absolute top-4 right-4 px-3.5 py-1.5 text-xs font-semibold bg-white/95 hover:bg-white text-guven-charcoal rounded-full backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 z-10 hover:scale-105"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-guven-blue" />
                  <span>Voir Photos HD</span>
                </button>

                {/* Video Floating Bottom Controls */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="pointer-events-auto px-3.5 py-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-105 shadow-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold"
                    title={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 text-guven-blue" />
                        <span className="text-[11px]">Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-guven-blue ml-0.5" />
                        <span className="text-[11px]">Lecture</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="pointer-events-auto px-3.5 py-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-105 shadow-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold"
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px]">Activer le son</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px]">Son actif</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={images[activeImgIndex]?.storage_path}
                  alt={product.name}
                  className="w-full h-full object-cover object-top cursor-zoom-in"
                  onClick={() => setIsZoomOpen(true)}
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.video_url && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-white/95 text-guven-charcoal backdrop-blur-sm rounded-full shadow-lg flex items-center gap-2 hover:bg-guven-blue hover:text-white transition-all ring-2 ring-guven-blue/20 hover:scale-105"
                    >
                      <div className="w-4 h-4 rounded-full bg-guven-blue flex items-center justify-center text-white">
                        <Play className="w-2.5 h-2.5 ml-0.5" />
                      </div>
                      <span>Lancer la Vidéo</span>
                    </button>
                  )}
                  {hasDiscount && (
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-guven-blue text-white rounded-full shadow-sm">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {/* Zoom Trigger */}
                <button
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-4 right-4 p-2.5 bg-white/90 hover:bg-white text-guven-charcoal rounded-full backdrop-blur-sm shadow-md transition-all hover:scale-110"
                  aria-label="Agrandir la photo"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Product Purchase Details */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
              {product.category?.name || 'Maison Güven Mode'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-guven-muted mt-1">Réf: {selectedVariant?.sku || product.sku}</p>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 py-2 border-y border-guven-border">
            <span className="text-2xl sm:text-3xl font-bold text-guven-charcoal">
              {product.base_price.toFixed(3)} DT
            </span>
            {hasDiscount && (
              <span className="text-base text-guven-muted line-through">
                {product.compare_at_price!.toFixed(3)} DT
              </span>
            )}
            <span className="text-xs text-emerald-600 font-semibold ml-auto flex items-center gap-1">
              <Check className="w-4 h-4" /> TVA Incluse
            </span>
          </div>

          {/* Short Editorial Description */}
          <p className="text-sm text-guven-charcoal/80 font-light leading-relaxed">
            {product.short_description || product.description}
          </p>

          {/* Color Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-guven-charcoal">
                Coloris : <span className="font-normal text-guven-muted">{selectedColor}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {uniqueColors.map((col) => (
                <button
                  key={col.color_name}
                  onClick={() => setSelectedColor(col.color_name)}
                  className={`relative p-0.5 rounded-full border-2 transition-all ${
                    selectedColor === col.color_name
                      ? 'border-guven-blue scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={col.color_name}
                >
                  <span
                    className="block w-6 h-6 rounded-full border border-black/15"
                    style={{ backgroundColor: col.color_hex }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-guven-charcoal">
                Taille : <span className="font-normal text-guven-muted">{selectedSize}</span>
              </span>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="flex items-center gap-1 text-guven-blue hover:text-guven-blue-deep font-semibold"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Guide des tailles</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {uniqueSizes.map((sz) => {
                const varForSize = product.variants.find(
                  (v) => v.color_name === selectedColor && v.size_label === sz
                );
                const isSzAvailable = varForSize?.inventory
                  ? varForSize.inventory.quantity_on_hand - varForSize.inventory.quantity_reserved > 0
                  : false;

                return (
                  <button
                    key={sz}
                    disabled={!isSzAvailable}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 text-xs rounded-xl border text-center transition-all ${
                      selectedSize === sz
                        ? 'border-guven-blue bg-guven-blue text-white font-bold shadow-sm'
                        : isSzAvailable
                        ? 'border-guven-border text-guven-charcoal hover:border-guven-blue bg-white'
                        : 'border-guven-border/40 text-guven-muted/40 bg-guven-ivory/50 cursor-not-allowed line-through'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Availability Tasteful Notice */}
          <div className="text-xs">
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-red-600 font-semibold p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Rupture de stock pour cette combinaison.</span>
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-2 text-amber-700 font-medium p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Plus que <strong>{availableStock} pièce(s)</strong> disponible(s).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>En stock et prêt à être expédié.</span>
              </div>
            )}
          </div>

          {/* Actions: Add to Cart & Wishlist */}
          <div className="flex items-center gap-3 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center border border-guven-border rounded-full bg-white px-3 py-2">
              <button
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 text-guven-charcoal hover:text-guven-blue disabled:opacity-40"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold text-guven-charcoal">
                {quantity}
              </span>
              <button
                disabled={quantity >= availableStock || isOutOfStock}
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="px-2 text-guven-charcoal hover:text-guven-blue disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1 py-4 bg-guven-blue hover:bg-guven-blue-deep disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-md hover:shadow-luxury-hover flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Indisponible' : 'Ajouter au Panier'}</span>
            </button>

            {/* Wishlist Toggle */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-4 rounded-full border transition-all ${
                isFavorited
                  ? 'border-red-200 bg-red-50 text-red-500 shadow-sm'
                  : 'border-guven-border hover:border-guven-blue text-guven-charcoal bg-white'
              }`}
              aria-label="Ajouter aux favoris"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Delivery & Assurance Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-guven-border text-xs text-guven-muted">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-guven-blue" />
              <span>Livraison 24-48h</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-guven-blue" />
              <span>Paiement à la livraison</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-guven-blue" />
              <span>Retours 14 jours</span>
            </div>
          </div>

          {/* Expandable Tabs */}
          <div className="pt-6 border-t border-guven-border">
            <div className="flex border-b border-guven-border gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-guven-blue text-guven-blue'
                    : 'border-transparent text-guven-muted hover:text-guven-charcoal'
                }`}
              >
                Matières & Coupe
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  activeTab === 'care'
                    ? 'border-guven-blue text-guven-blue'
                    : 'border-transparent text-guven-muted hover:text-guven-charcoal'
                }`}
              >
                Entretien
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  activeTab === 'delivery'
                    ? 'border-guven-blue text-guven-blue'
                    : 'border-transparent text-guven-muted hover:text-guven-charcoal'
                }`}
              >
                Livraison & Retours
              </button>
            </div>

            <div className="py-4 text-xs text-guven-charcoal/80 leading-relaxed">
              {activeTab === 'details' && (
                <div className="space-y-2">
                  <p><strong>Composition :</strong> {product.composition || 'Crêpe de soie haute qualité.'}</p>
                  <p><strong>Coupe :</strong> {product.size_guide || 'Fidèle à la taille indiquée.'}</p>
                  <p>{product.description}</p>
                </div>
              )}
              {activeTab === 'care' && (
                <p>{product.care_instructions || 'Nettoyage délicat à la main ou pressing spécialisé recommandé.'}</p>
              )}
              {activeTab === 'delivery' && (
                <p>
                  Livraison sécurisée avec Aramex ou coursier express sur toute la Tunisie.
                  Frais de port offerts dès 180 TND d'achat. Échanges facilités sous 14 jours.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-guven-border">
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-guven-ivory text-guven-muted"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl font-bold text-guven-charcoal mb-2">
              Guide des Tailles Güven Mode
            </h3>
            <p className="text-xs text-guven-muted mb-6">
              Nos modèles sont confectionnés selon les standards du prêt-à-porter haute couture.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-guven-ivory uppercase tracking-wider text-guven-muted">
                  <tr>
                    <th className="py-2.5 px-3">Taille</th>
                    <th className="py-2.5 px-3">Poitrine (cm)</th>
                    <th className="py-2.5 px-3">Taille (cm)</th>
                    <th className="py-2.5 px-3">Bassin (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-guven-border">
                  <tr>
                    <td className="py-2.5 px-3 font-bold">36 (S)</td>
                    <td className="py-2.5 px-3">82 - 86</td>
                    <td className="py-2.5 px-3">64 - 68</td>
                    <td className="py-2.5 px-3">90 - 94</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">38 (M)</td>
                    <td className="py-2.5 px-3">86 - 90</td>
                    <td className="py-2.5 px-3">68 - 72</td>
                    <td className="py-2.5 px-3">94 - 98</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">40 (L)</td>
                    <td className="py-2.5 px-3">90 - 96</td>
                    <td className="py-2.5 px-3">72 - 78</td>
                    <td className="py-2.5 px-3">98 - 104</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">42 (XL)</td>
                    <td className="py-2.5 px-3">96 - 102</td>
                    <td className="py-2.5 px-3">78 - 84</td>
                    <td className="py-2.5 px-3">104 - 110</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 pt-4 border-t border-guven-border text-center">
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-full py-3 bg-guven-blue text-white rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomOpen(false)}
        >
          <img
            src={images[activeImgIndex]?.storage_path}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 pt-16 border-t border-guven-border">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
              Complétez votre silhouette
            </span>
            <h2 className="font-serif text-3xl font-bold text-guven-charcoal mt-1">
              Vous Aimerez Aussi
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
