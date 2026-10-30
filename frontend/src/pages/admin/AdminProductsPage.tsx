import React, { useEffect, useState } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, X, 
  Check, AlertCircle, Loader2, Image as ImageIcon, Layers, Minus,
  Upload, Film
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Product, Category, ProductVariant } from '../../types/index.js';

interface EditableVariant {
  id?: string;
  size_label: string;
  color_name: string;
  color_hex: string;
  quantity_on_hand: number;
}

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('189.000');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [composition, setComposition] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [saving, setSaving] = useState(false);

  // Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem('guven_auth_token');
    const adminKey = localStorage.getItem('guven_admin_key') || 'guven-admin-2026';
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {
      'x-admin-key': adminKey
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Échec du téléversement du fichier');
    }
    return data.data.url;
  };

  const handlePrimaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadFile(file);
      setImageUrl(url);
    } catch (err: any) {
      alert(`Erreur d'importation: ${err.message}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingGallery(true);
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i]);
        urls.push(url);
      }
      setAdditionalImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      alert(`Erreur d'importation galerie: ${err.message}`);
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVideo(true);
      const url = await uploadFile(file);
      setVideoUrl(url);
    } catch (err: any) {
      alert(`Erreur d'importation vidéo: ${err.message}`);
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes]: any = await Promise.all([
        api.get('/admin/products?limit=100'),
        api.get('/admin/categories')
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setBasePrice('189.000');
    setCompareAtPrice('');
    setShortDesc('');
    setDesc('');
    setComposition('100% Crêpe de Soie.');
    setImageUrl('');
    setAdditionalImages([]);
    setVideoUrl('');
    setStatus('published');
    setVariants([
      { size_label: '36 (S)', color_name: 'Bleu Güven', color_hex: '#1598C8', quantity_on_hand: 8 },
      { size_label: '38 (M)', color_name: 'Bleu Güven', color_hex: '#1598C8', quantity_on_hand: 6 },
      { size_label: '40 (L)', color_name: 'Bleu Güven', color_hex: '#1598C8', quantity_on_hand: 4 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id || categories[0]?.id || '');
    setBasePrice(p.base_price.toFixed(3));
    setCompareAtPrice(p.compare_at_price ? p.compare_at_price.toFixed(3) : '');
    setShortDesc(p.short_description || '');
    setDesc(p.description || '');
    setComposition(p.composition || '');
    
    const primary = p.images.find(img => img.is_primary)?.storage_path || p.images[0]?.storage_path || '';
    const others = p.images.filter(img => img.storage_path !== primary).map(img => img.storage_path);
    setImageUrl(primary);
    setAdditionalImages(others);
    setVideoUrl(p.video_url || '');
    setStatus(p.status === 'published' ? 'published' : 'draft');
    
    // Map product variants to editable format
    if (p.variants && p.variants.length > 0) {
      setVariants(
        p.variants.map((v) => ({
          id: v.id,
          size_label: v.size_label,
          color_name: v.color_name,
          color_hex: v.color_hex || '#1598C8',
          quantity_on_hand: v.inventory?.quantity_on_hand ?? 5
        }))
      );
    } else {
      setVariants([
        { size_label: 'Standard', color_name: 'Bleu Güven', color_hex: '#1598C8', quantity_on_hand: 10 }
      ]);
    }

    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      {
        size_label: '38 (M)',
        color_name: variants[0]?.color_name || 'Bleu Güven',
        color_hex: variants[0]?.color_hex || '#1598C8',
        quantity_on_hand: 5
      }
    ]);
  };

  const handleUpdateVariantField = (index: number, field: keyof EditableVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) {
      alert('Un vêtement doit posséder au moins une déclinaison/taille.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette création ?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formattedVariants = variants.map((v, i) => ({
        id: v.id,
        size_label: v.size_label,
        color_name: v.color_name,
        color_hex: v.color_hex,
        sku: `GM-${name.substring(0, 3).toUpperCase()}-${v.size_label.substring(0, 2)}-${i + 1}`,
        inventory: {
          quantity_on_hand: Number(v.quantity_on_hand) || 0,
          quantity_reserved: 0,
          available_stock: Number(v.quantity_on_hand) || 0,
          low_stock_threshold: 2
        }
      }));

      const payload: any = {
        name,
        category_id: categoryId || null,
        base_price: Number(basePrice),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        short_description: shortDesc,
        description: desc,
        composition,
        status,
        currency: 'TND',
        video_url: videoUrl ? videoUrl.trim() : null,
        images: [
          ...(imageUrl ? [{
            storage_path: imageUrl,
            alt_text: name,
            sort_order: 0,
            is_primary: true
          }] : []),
          ...additionalImages.map((path, idx) => ({
            storage_path: path,
            alt_text: `${name} - ${idx + 2}`,
            sort_order: idx + 1,
            is_primary: false
          }))
        ],
        variants: formattedVariants
      };

      if (!editingProduct) {
        const created: Product = await api.post('/admin/products', payload);
        setProducts([created, ...products]);
      } else {
        const updated: Product = await api.patch(`/admin/products/${editingProduct.id}`, payload);
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue Produits & Variantes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Création, modification intégrale des pièces de prêt-à-porter, tailles, stocks et coloris.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Création</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Products Display (Responsive: Cards on Mobile, Table on Desktop) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 text-guven-blue animate-spin mb-2" />
            <p className="text-xs">Chargement du catalogue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">Aucun produit ne correspond.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filtered.map((prod) => (
                <div key={prod.id} className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={prod.images[0]?.storage_path || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                      alt={prod.name}
                      className="w-16 h-20 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{prod.sku}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            prod.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {prod.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{prod.name}</h4>
                      <p className="text-xs font-semibold text-guven-blue mt-0.5">
                        {prod.base_price.toFixed(3)} DT
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {prod.category?.name || 'Général'} • {prod.variants.length} variante(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier & Stock</span>
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Pièce</th>
                    <th className="py-3.5 px-6">Catégorie</th>
                    <th className="py-3.5 px-6">SKU</th>
                    <th className="py-3.5 px-6">Prix</th>
                    <th className="py-3.5 px-6">Variantes & Stock</th>
                    <th className="py-3.5 px-6">Statut</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]?.storage_path || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                            alt={prod.name}
                            className="w-10 h-14 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{prod.name}</p>
                            <p className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">{prod.short_description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-700">
                        {prod.category?.name || 'Général'}
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600">
                        {prod.sku}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {prod.base_price.toFixed(3)} DT
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="font-semibold text-gray-800">{prod.variants.length} déclinaison(s)</span>
                        <div className="flex gap-1 mt-1">
                          {prod.variants.map((v) => (
                            <span key={v.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {v.size_label}: {v.inventory?.quantity_on_hand ?? 0}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            prod.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {prod.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-guven-blue transition-colors"
                          title="Modifier détails et variantes"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-gray-200 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">
                {editingProduct ? 'Modifier la Création Güven Mode' : 'Nouvelle Création Güven Mode'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom du modèle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robe Élégance Azur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Statut</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="published">Publié (En ligne)</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Prix de Vente (TND) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Prix Barré / Promo (TND)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Optionnel"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Media Section: Photo Principale + Vidéo + Galerie */}
              <div className="space-y-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-guven-blue" />
                    <span>Photos & Vidéo du Produit (Haute Définition)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Importez directement depuis votre PC. Vos images et vidéos sont sauvegardées en haute qualité sur le CDN Supabase et restent visibles même après hébergement.
                  </p>
                </div>

                {/* Photo Principale */}
                <div>
                  <label className="block font-semibold text-gray-700 text-xs mb-1.5">
                    Photo Principale *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {imageUrl ? (
                      <div className="relative w-28 h-36 rounded-xl overflow-hidden border border-gray-200 bg-white group shrink-0">
                        <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                          title="Supprimer la photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                          Photo Principale
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 h-36 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white shrink-0">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[10px]">Aucune photo</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Importation sur Supabase...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Importer une photo depuis votre PC</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handlePrimaryImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] text-gray-400 block mb-1">Ou coller une URL d'image :</span>
                        <input
                          type="url"
                          required={!imageUrl}
                          placeholder="https://... (ou importez depuis votre PC ci-dessus)"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Galerie de Photos Supplémentaires */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-700 text-xs">
                      Photos Supplémentaires / Galerie ({additionalImages.length})
                    </label>
                    <label className="cursor-pointer text-xs font-semibold text-guven-blue hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter des photos du PC</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadingGallery && (
                    <div className="p-2 text-xs text-guven-blue flex items-center gap-2 bg-blue-50 rounded-lg mb-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Téléversement de la galerie vers Supabase...</span>
                    </div>
                  )}

                  {additionalImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white group">
                          <img src={url} alt={`Galerie ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Supprimer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vidéo du Modèle */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="block font-semibold text-gray-700 text-xs mb-1.5">
                    Vidéo Défilé / Mannequin (Optionnel - MP4, WebM)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {videoUrl ? (
                      <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-gray-200 bg-black shrink-0">
                        <video src={videoUrl} autoPlay muted loop className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setVideoUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                          title="Supprimer la vidéo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
                          Vidéo Active
                        </div>
                      </div>
                    ) : null}

                    <div className="flex-1 w-full space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-black text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                        {uploadingVideo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Téléversement vidéo vers Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-3.5 h-3.5 text-guven-blue" />
                            <span>Importer une vidéo depuis votre PC (MP4 / WebM)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Ou coller un lien MP4..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Variantes & Stocks section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Variantes, Tailles & Stocks</h4>
                    <p className="text-[11px] text-gray-500">Définissez chaque taille, couleur et quantité en stock physique</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-2.5 py-1.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-semibold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter Taille</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] text-gray-400 uppercase font-semibold">Taille</label>
                        <input
                          type="text"
                          required
                          value={v.size_label}
                          onChange={(e) => handleUpdateVariantField(idx, 'size_label', e.target.value)}
                          placeholder="38 (M)"
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-guven-blue"
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] text-gray-400 uppercase font-semibold">Nom Couleur</label>
                        <input
                          type="text"
                          required
                          value={v.color_name}
                          onChange={(e) => handleUpdateVariantField(idx, 'color_name', e.target.value)}
                          placeholder="Bleu Güven"
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-guven-blue"
                        />
                      </div>
                      <div className="w-16">
                        <label className="block text-[10px] text-gray-400 uppercase font-semibold">Nuance</label>
                        <input
                          type="color"
                          value={v.color_hex}
                          onChange={(e) => handleUpdateVariantField(idx, 'color_hex', e.target.value)}
                          className="w-full h-7 rounded border border-gray-200 cursor-pointer p-0.5"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] text-gray-400 uppercase font-semibold">Stock dispo</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={v.quantity_on_hand}
                          onChange={(e) => handleUpdateVariantField(idx, 'quantity_on_hand', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-guven-blue font-bold text-gray-900"
                        />
                      </div>
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer cette taille"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description courte (accroche)</label>
                <input
                  type="text"
                  placeholder="Robe fluide ceinturée en crêpe de soie..."
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description éditoriale complète</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Composition & Matières</label>
                <input
                  type="text"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct ? 'Enregistrer les modifications' : 'Créer et Publier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
