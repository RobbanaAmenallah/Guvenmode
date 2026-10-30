import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, Facebook, Instagram } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo.js';
import { useCartStore } from '../../stores/useCartStore.js';
import { useWishlistStore } from '../../stores/useWishlistStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { SearchModal } from './SearchModal.js';
import { CartDrawer } from './CartDrawer.js';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const totalCartCount = useCartStore((state) => state.getTotalItemsCount());
  const openCart = useCartStore((state) => state.openCart);
  const wishlistCount = useWishlistStore((state) => state.productIds.length);
  const { isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Boutique', path: '/boutique' },
    { name: 'Nouveautés', path: '/nouveautes' },
    { name: 'Collections', path: '/collections' },
    { name: 'Robes', path: '/categories/robes' },
    { name: 'Ensembles', path: '/categories/ensembles' },
    { name: 'Promotions', path: '/promotions' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-guven-border/60'
            : 'bg-guven-ivory py-4 border-b border-guven-border/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-guven-charcoal hover:text-guven-blue transition-colors"
                aria-label="Menu de navigation"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <BrandLogo size="md" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-7">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors relative py-1 ${
                      isActive
                        ? 'text-guven-blue font-semibold'
                        : 'text-guven-charcoal hover:text-guven-blue'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-guven-blue rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions: Search, Wishlist, Account, Bag */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Admin shortcut if logged in as admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-guven-blue text-white hover:bg-guven-blue-deep transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-guven-charcoal hover:text-guven-blue transition-colors rounded-full hover:bg-white"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                to="/favoris"
                className="p-2 text-guven-charcoal hover:text-guven-blue transition-colors rounded-full hover:bg-white relative"
                aria-label="Favoris"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-guven-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                to={isAuthenticated ? '/mon-compte' : '/connexion'}
                className="p-2 text-guven-charcoal hover:text-guven-blue transition-colors rounded-full hover:bg-white"
                aria-label="Mon compte"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Shopping Bag Button */}
              <button
                onClick={openCart}
                className="p-2 text-guven-charcoal hover:text-guven-blue transition-colors rounded-full hover:bg-white relative"
                aria-label="Panier d'achat"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-guven-blue text-white text-[10px] font-bold flex items-center justify-center animate-scale-up">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-guven-border px-6 py-6 shadow-xl animate-slide-up">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm uppercase tracking-[0.18em] font-medium py-1.5 border-b border-guven-border/40 ${
                    location.pathname === link.path ? 'text-guven-blue font-bold' : 'text-guven-charcoal'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="mt-2 py-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg bg-guven-blue text-white"
                >
                  Accès Tableau de bord Admin
                </Link>
              )}

              <div className="pt-4 text-xs text-guven-muted border-t border-guven-border/40">
                <p className="font-semibold text-guven-charcoal">Conciergerie Güven Mode</p>
                <p className="mt-1">📞 +216 28 827 626 • ✉️ guvenmode@gmail.com</p>
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href="https://www.facebook.com/search/top?q=guven%20mode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-guven-ivory text-guven-charcoal hover:bg-guven-blue hover:text-white transition-colors"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://www.instagram.com/guven_mode/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-guven-ivory text-guven-charcoal hover:bg-guven-blue hover:text-white transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Modals & Drawers */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer />
    </>
  );
};
