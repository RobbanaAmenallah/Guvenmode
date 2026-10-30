import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, Award } from 'lucide-react';
import { api } from '../api/client.js';
import { ProductCard } from '../components/product/ProductCard.js';
import { Category, Collection, Product } from '../types/index.js';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data: any = await api.get('/homepage');
        setCategories(data.categories || []);
        setCollections(data.collections || []);
        setFeaturedProducts(data.featuredProducts || []);
        setNewArrivals(data.newArrivals || []);
        setHeroData(data.hero);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24">
      {/* 1. Hero Editorial Section */}
      <section className="relative min-h-[82vh] flex items-center bg-guven-ivory overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-guven-sand/40 border border-guven-sand text-guven-charcoal text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-guven-blue" />
              <span>{heroData?.badge || 'Maison de Mode Tunisienne'}</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-guven-charcoal leading-[1.08] tracking-tight">
              {heroData?.title || 'Votre style, votre signature.'}
            </h1>

            <p className="text-base sm:text-lg text-guven-muted max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {heroData?.subtitle ||
                'Découvrez une mode féminine pensée pour chaque instant. L\'élégance contemporaine, la précision des coupes et le confort absolu réunis dans nos créations exclusives.'}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/boutique"
                className="w-full sm:w-auto px-8 py-4 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-md hover:shadow-luxury-hover flex items-center justify-center gap-2 group"
              >
                <span>{heroData?.button_text || 'Découvrir la collection'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/collections"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-guven-sand/30 text-guven-charcoal text-xs font-semibold uppercase tracking-[0.2em] rounded-full border border-guven-border transition-colors text-center"
              >
                Voir les collections
              </Link>
            </div>
          </div>

          {/* Hero Visual Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
                <img
                  src={
                    heroData?.image_url ||
                    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'
                  }
                  alt="GÜVEN MODE Nouvelle Collection"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Decorative Floating Luxury Pill */}
              <div className="absolute -bottom-6 -left-6 sm:bottom-6 sm:-left-8 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-luxury border border-guven-border max-w-[220px]">
                <p className="text-xs uppercase tracking-wider font-semibold text-guven-blue">
                  Pièce Maîtresse
                </p>
                <p className="font-serif text-sm font-bold text-guven-charcoal mt-0.5">
                  Robe Élégance Azur
                </p>
                <p className="text-xs text-guven-muted mt-1">
                  Crêpe de soie & bleu emblématique
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
              Univers
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal mt-1">
              Nos Lignes de Création
            </h2>
          </div>
          <Link
            to="/boutique"
            className="text-xs font-semibold uppercase tracking-wider text-guven-charcoal hover:text-guven-blue flex items-center gap-1.5 transition-colors group"
          >
            <span>Toutes les catégories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm"
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 inset-x-5 text-white">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">{cat.name}</h3>
                <span className="text-[11px] uppercase tracking-widest text-white/80 group-hover:text-guven-blue transition-colors flex items-center gap-1 mt-1">
                  Explorer
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
            Nouveautés
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal mt-1">
            Les Dernières Silhouettes
          </h2>
          <p className="text-sm text-guven-muted mt-2 font-light">
            Découvrez nos créations fraîchement confectionnées dans nos ateliers pour sublimer votre vestiaire.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/nouveautes"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-guven-charcoal text-guven-charcoal hover:bg-guven-charcoal hover:text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
          >
            <span>Voir toutes les nouveautés</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Featured Collection Editorial Banner */}
      <section className="bg-guven-charcoal text-white py-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-guven-blue">
                Collection Capsule
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
                L'Allure Cérémonie & Soirée
              </h2>
              <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed max-w-lg">
                Des étoffes somptueuses, des drapés couture et des finitions faites à la main.
                Chaque robe de notre collection de soirée est pensée pour faire de vos événements
                les plus précieux un souvenir inoubliable.
              </p>
              <div className="pt-2">
                <Link
                  to="/collections/capsule-ceremonie"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all"
                >
                  <span>Découvrir la capsule</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop"
                alt="Capsule Cérémonie"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-guven-blue">
              Incontournables
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal mt-1">
              Les Pièces Coup de Cœur
            </h2>
          </div>
          <Link
            to="/boutique?sort=popular"
            className="text-xs font-semibold uppercase tracking-wider text-guven-charcoal hover:text-guven-blue flex items-center gap-1.5 transition-colors group"
          >
            <span>Voir les pièces les plus demandées</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Brand Story & Craftsmanship */}
      <section className="bg-guven-ivory py-20 border-y border-guven-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <img
            src="/guven-logo.jpg"
            alt="GÜVEN MODE"
            className="w-20 h-20 mx-auto rounded-full shadow-md object-contain"
          />
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-guven-charcoal">
            La Maison GÜVEN MODE
          </h2>
          <p className="text-base sm:text-lg text-guven-muted font-light leading-relaxed">
            Fondée avec la passion d'habiller les femmes d'une élégance sans compromis,
            la maison GÜVEN MODE s'engage à proposer des pièces confectionnées avec exigence,
            alliant matières nobles, coupes contemporaines et savoir-faire d'exception.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-8 text-xs uppercase tracking-widest text-guven-charcoal font-semibold">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-guven-blue" />
              Excellence des Matières
            </span>
            <span className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-guven-blue" />
              Accompagnement Dédié
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-guven-blue" />
              Confiance & Sérénité
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
