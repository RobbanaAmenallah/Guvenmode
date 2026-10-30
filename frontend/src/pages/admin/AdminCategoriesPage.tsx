import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit2, Trash2, X, Check, Loader2, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client.js';
import { Category, Collection } from '../../types/index.js';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImg, setCatImg] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [uploadingCatImg, setUploadingCatImg] = useState(false);

  // Collection Modal State
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [colName, setColName] = useState('');
  const [colSlug, setColSlug] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colImg, setColImg] = useState('');
  const [savingCol, setSavingCol] = useState(false);
  const [uploadingColImg, setUploadingColImg] = useState(false);

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

  const handleCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCatImg(true);
      const url = await uploadFile(file);
      setCatImg(url);
    } catch (err: any) {
      alert(`Erreur d'importation: ${err.message}`);
    } finally {
      setUploadingCatImg(false);
      e.target.value = '';
    }
  };

  const handleColImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingColImg(true);
      const url = await uploadFile(file);
      setColImg(url);
    } catch (err: any) {
      alert(`Erreur d'importation: ${err.message}`);
    } finally {
      setUploadingColImg(false);
      e.target.value = '';
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, cols]: any = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/collections')
      ]);
      setCategories(cats || []);
      setCollections(cols || []);
    } catch (err) {
      console.error('Error fetching categories & collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatImg('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDesc(c.description || '');
    setCatImg(c.image_url || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCat(true);
      const payload = {
        name: catName,
        slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: catDesc,
        image_url: catImg
      };

      if (!editingCategory) {
        const newCat: Category = await api.post('/admin/categories', payload);
        setCategories([...categories, newCat]);
      } else {
        const updatedCat: Category = await api.patch(`/admin/categories/${editingCategory.id}`, payload);
        setCategories(categories.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
      }

      setIsCategoryModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Collection Handlers
  const handleOpenAddCollection = () => {
    setEditingCollection(null);
    setColName('');
    setColSlug('');
    setColDesc('');
    setColImg('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000');
    setIsCollectionModalOpen(true);
  };

  const handleOpenEditCollection = (col: Collection) => {
    setEditingCollection(col);
    setColName(col.name);
    setColSlug(col.slug);
    setColDesc(col.description || '');
    setColImg(col.cover_image_url || '');
    setIsCollectionModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCol(true);
      const payload = {
        name: colName,
        slug: colSlug || colName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: colDesc,
        cover_image_url: colImg
      };

      if (!editingCollection) {
        const newCol: Collection = await api.post('/admin/collections', payload);
        setCollections([...collections, newCol]);
      } else {
        const updatedCol: Collection = await api.patch(`/admin/collections/${editingCollection.id}`, payload);
        setCollections(collections.map((c) => (c.id === updatedCol.id ? updatedCol : c)));
      }

      setIsCollectionModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSavingCol(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('Supprimer cette collection éditoriale ?')) return;
    try {
      await api.delete(`/admin/collections/${id}`);
      setCollections(collections.filter((c) => c.id !== id));
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catégories & Collections</h1>
        <p className="text-xs text-gray-500 mt-1">
          Organisation complète de l'arborescence, des univers vestimentaires et des collections éditoriales.
        </p>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-gray-900">Catégories de Produits</h3>
            <p className="text-xs text-gray-500">Les univers affichés dans le menu principal et les filtres boutique</p>
          </div>
          <button
            onClick={handleOpenAddCategory}
            className="px-4 py-2 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Catégorie</span>
          </button>
        </div>

        {/* Mobile View for Categories */}
        <div className="block md:hidden divide-y divide-gray-100">
          {categories.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={c.image_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                  alt={c.name}
                  className="w-12 h-14 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{c.name}</h4>
                  <p className="text-xs font-mono text-gray-400">/{c.slug}</p>
                  <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{c.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditCategory(c)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View for Categories */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-6">Image</th>
                <th className="py-3.5 px-6">Nom</th>
                <th className="py-3.5 px-6">Slug</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Statut</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-6">
                    <img
                      src={c.image_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200'}
                      alt={c.name}
                      className="w-10 h-12 object-cover rounded-lg bg-gray-100"
                    />
                  </td>
                  <td className="py-3 px-6 font-bold text-gray-900">{c.name}</td>
                  <td className="py-3 px-6 font-mono text-gray-500">{c.slug}</td>
                  <td className="py-3 px-6 text-gray-600 line-clamp-1 max-w-xs">{c.description}</td>
                  <td className="py-3 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditCategory(c)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-guven-blue transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
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
      </div>

      {/* Collections Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-gray-900">Collections Éditoriales</h3>
            <p className="text-xs text-gray-500">Thématiques saisonnières et capsules exclusives mises en avant</p>
          </div>
          <button
            onClick={handleOpenAddCollection}
            className="px-4 py-2 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Collection</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4 sm:p-6">
          {collections.map((col) => (
            <div key={col.id} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="aspect-[16/9] relative bg-gray-100">
                  <img
                    src={col.cover_image_url}
                    alt={col.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-serif text-lg font-bold text-gray-900">{col.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{col.description}</p>
                  <p className="text-[11px] font-mono text-guven-blue pt-1">/{col.slug}</p>
                </div>
              </div>
              <div className="p-4 pt-0 flex justify-end gap-2 border-t border-gray-100 mt-2">
                <button
                  onClick={() => handleOpenEditCollection(col)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-guven-blue hover:text-white text-gray-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDeleteCollection(col.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                {editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom de la catégorie *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combinaisons"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Slug URL</label>
                <input
                  type="text"
                  placeholder="combinaisons (généré automatiquement si vide)"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-mono"
                />
              </div>

              {/* Image de Couverture avec Upload PC */}
              <div className="space-y-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-200">
                <label className="block font-semibold text-gray-700 text-xs">
                  Photo de Couverture de la Catégorie
                </label>
                <div className="flex gap-3 items-center">
                  {catImg ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white group shrink-0">
                      <img src={catImg} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCatImg('')}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        title="Supprimer la photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white shrink-0">
                      <ImageIcon className="w-5 h-5 mb-0.5 opacity-50" />
                      <span className="text-[9px]">Aucune photo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                        {uploadingCatImg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Importation sur Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Importer depuis votre PC</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleCatImageUpload}
                          disabled={uploadingCatImg}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Ou URL directe :</span>
                      <input
                        type="url"
                        placeholder="https://... (ou importez depuis votre PC)"
                        value={catImg}
                        onChange={(e) => setCatImg(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description courte</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-6 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCategory ? 'Enregistrer' : 'Créer la catégorie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Collection Modal */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                {editingCollection ? 'Modifier la Collection' : 'Nouvelle Collection Éditoriale'}
              </h3>
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom de la collection *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Soirée Orientale"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Slug URL</label>
                <input
                  type="text"
                  placeholder="soiree-orientale"
                  value={colSlug}
                  onChange={(e) => setColSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none font-mono"
                />
              </div>

              {/* Image de Couverture Collection avec Upload PC */}
              <div className="space-y-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-200">
                <label className="block font-semibold text-gray-700 text-xs">
                  Photo de Couverture de la Collection
                </label>
                <div className="flex gap-3 items-center">
                  {colImg ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white group shrink-0">
                      <img src={colImg} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setColImg('')}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        title="Supprimer la photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white shrink-0">
                      <ImageIcon className="w-5 h-5 mb-0.5 opacity-50" />
                      <span className="text-[9px]">Aucune photo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-guven-blue hover:bg-guven-blue-deep text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                        {uploadingColImg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Importation sur Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Importer depuis votre PC</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleColImageUpload}
                          disabled={uploadingColImg}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Ou URL directe :</span>
                      <input
                        type="url"
                        placeholder="https://... (ou importez depuis votre PC)"
                        value={colImg}
                        onChange={(e) => setColImg(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description éditoriale</label>
                <textarea
                  rows={2}
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-guven-blue focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCollectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingCol}
                  className="px-6 py-2.5 bg-guven-blue hover:bg-guven-blue-deep text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {savingCol ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCollection ? 'Enregistrer' : 'Créer la collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
