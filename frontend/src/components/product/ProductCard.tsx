import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Video } from 'lucide-react';
import { Product } from '../../types/index.js';
import { useWishlistStore } from '../../stores/useWishlistStore.js';
import { useCartStore } from '../../stores/useCartStore.js';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);

  const isFavorited = isInWishlist(product.id);
  const primaryImg = product.images.find((img) => img.is_primary)?.storage_path || product.images[0]?.storage_path;
  const secondaryImg = product.images[1]?.storage_path || primaryImg;

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)
    : 0;

  // Extract unique colors
  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.color_name, v])).values()
  );

  // Check overall stock
  const totalAvailable = product.variants.reduce(
    (sum, v) => sum + (v.inventory ? v.inventory.quantity_on_hand - v.inventory.quantity_reserved : 0),
    0
  );
  const isOutOfStock = totalAvailable <= 0;
  const isLowStock = totalAvailable > 0 && totalAvailable <= 3;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Quick add default first available variant
    const defaultVariant = product.variants.find(
      (v) => (v.inventory ? v.inventory.quantity_on_hand - v.inventory.quantity_reserved : 0) > 0
    ) || product.variants[0];

    if (defaultVariant) {
      addItem(product, defaultVariant, 1);
    }
  };

  return (
    <div
      className="group relative flex flex-col transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link
        to={`/produit/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-guven-ivory block"
      >
        {isHovered && product.video_url ? (
          <video
            src={product.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <img
            src={isHovered && secondaryImg ? secondaryImg : primaryImg}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.video_url && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-guven-charcoal backdrop-blur-sm rounded-full shadow-sm flex items-center gap-1">
              <Video className="w-3 h-3 text-guven-blue" />
              <span>Vidéo</span>
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-guven-blue text-white rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.is_featured && !hasDiscount && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-guven-charcoal text-white rounded-full shadow-sm">
              Édition
            </span>
          )}
          {isLowStock && (
            <span className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500/90 text-white rounded-full backdrop-blur-xs">
              Dernières pièces
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold bg-guven-charcoal/80 text-white rounded-full backdrop-blur-xs">
              Rupture de stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            isFavorited
              ? 'bg-red-50 text-red-500 shadow-md'
              : 'bg-white/80 hover:bg-white text-guven-charcoal backdrop-blur-sm hover:text-red-500 shadow-sm'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Overlay on Desktop Hover */}
        {!isOutOfStock && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex gap-2">
            <button
              onClick={handleQuickAdd}
              className="flex-1 py-2.5 px-4 bg-white/95 hover:bg-guven-blue hover:text-white text-guven-charcoal text-xs font-semibold uppercase tracking-wider rounded-xl backdrop-blur-sm transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
            <span className="p-2.5 bg-white/95 text-guven-charcoal hover:text-guven-blue rounded-xl backdrop-blur-sm transition-colors shadow-md flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="pt-3.5 pb-2 flex flex-col flex-1">
        {/* Colors Preview */}
        {uniqueColors.length > 1 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {uniqueColors.map((col) => (
              <span
                key={col.color_name}
                title={col.color_name}
                className="w-3 h-3 rounded-full border border-black/15 transition-transform hover:scale-125"
                style={{ backgroundColor: col.color_hex }}
              />
            ))}
            <span className="text-[11px] text-guven-muted ml-1">
              +{uniqueColors.length} coloris
            </span>
          </div>
        )}

        {/* Category Tag */}
        <p className="text-[11px] uppercase tracking-wider text-guven-muted mb-0.5">
          {product.category?.name || 'Collection'}
        </p>

        {/* Product Name */}
        <Link to={`/produit/${product.slug}`} className="group-hover:text-guven-blue transition-colors">
          <h3 className="font-serif text-lg font-semibold text-guven-charcoal leading-snug line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-guven-charcoal">
            {product.base_price.toFixed(3)} DT
          </span>
          {hasDiscount && (
            <span className="text-xs text-guven-muted line-through">
              {product.compare_at_price!.toFixed(3)} DT
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
