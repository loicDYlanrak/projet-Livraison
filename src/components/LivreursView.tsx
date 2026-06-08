import { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, X, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Livreur } from '../types.ts';
import { apiClient } from '../App.tsx';

export default function LivreursView() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Livreur>>({});

  const [isCreating, setIsCreating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const fetchLivreurs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/livreurs');
      setLivreurs(data);
      setError('');
    } catch (e: any) {
      setError('Connection refused: ensure Postgres container is running.');
      // for demo, fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivreurs();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatut]);

  const handleSave = async (id?: number) => {
    try {
      if (id) {
        await apiClient.put(`/api/livreurs/${id}`, editForm);
        setIsEditing(null);
      } else {
        await apiClient.post('/api/livreurs', editForm);
        setIsCreating(false);
      }
      fetchLivreurs();
      setEditForm({});
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await apiClient.delete(`/api/livreurs/${id}`);
      fetchLivreurs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtrer les livreurs
  const filteredLivreurs = livreurs.filter(l => {
    const matchSearch = searchTerm === "" || 
      l.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.telephone?.includes(searchTerm) ||
      l.id?.toString().includes(searchTerm);
    
    const matchStatut = filterStatut === "" || l.statut === filterStatut;
    
    return matchSearch && matchStatut;
  });

  // Pagination calculations
  const totalItems = filteredLivreurs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLivreurs = filteredLivreurs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Calculer la plage d'affichage pour l'info texte
  const getDisplayRange = () => {
    if (totalItems === 0) return "0 élément";
    const from = startIndex + 1;
    const to = Math.min(endIndex, totalItems);
    return `${from} - ${to} sur ${totalItems} livreur${totalItems > 1 ? 's' : ''}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-[15px] border-b-2 border-line mb-0 shrink-0">
        <h3 className="text-[20px] m-0 font-serif italic text-ink">Gestion des Livreurs</h3>
        <button 
          onClick={() => { setIsCreating(true); setEditForm({ statut: 'disponible' }); setCurrentPage(1); }}
          className="btn-theme"
        >
          + Ajouter Un Livreur
        </button>
      </div>

      {error && (
        <div className="p-3 m-4 bg-[#EF9A9A] text-ink border border-line font-mono text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_2fr_2fr_120px_1fr_100px_100px] sticky top-0 bg-white z-10">
          <div className="col-header">ID</div>
          <div className="col-header">Nom</div>
          <div className="col-header">Prénom</div>
          <div className="col-header">Téléphone</div>
          <div className="col-header">Zone/Secteur</div>
          <div className="col-header">Statut</div>
          <div className="col-header border-r-0 text-right">Actions</div>
        </div>

        <div className="flex flex-col">
          {isCreating && (
            <div className="grid grid-cols-[60px_2fr_2fr_120px_1fr_100px_100px] border-b border-line bg-ink/5">
              <div className="data-cell font-mono text-xs text-ink/50">New</div>
              <div className="data-cell"><input type="text" className="input-theme !p-1" placeholder="Nom" onChange={e => setEditForm({...editForm, nom: e.target.value})} /></div>
              <div className="data-cell"><input type="text" className="input-theme !p-1" placeholder="Prénom" onChange={e => setEditForm({...editForm, prenom: e.target.value})} /></div>
              <div className="data-cell"><input type="text" className="input-theme !p-1" placeholder="Tel" onChange={e => setEditForm({...editForm, telephone: e.target.value})} /></div>
              <div className="data-cell"><input type="text" className="input-theme !p-1" placeholder="Zone" onChange={e => setEditForm({...editForm, zone_secteur: e.target.value})} /></div>
              <div className="data-cell">
                <select className="input-theme !p-1" onChange={e => setEditForm({...editForm, statut: e.target.value})} defaultValue="disponible">
                  <option value="disponible">disponible</option>
                  <option value="en_livraison">en livraison</option>
                  <option value="actif">actif</option>
                  <option value="inactif">inactif</option>
                  <option value="repos">repos</option>
                  <option value="en_conge">en congé</option>
                </select>
              </div>
              <div className="data-cell justify-end gap-2 border-r-0">
                <button onClick={() => handleSave()} className="text-[#228B22]"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setIsCreating(false); setEditForm({}); }} className="text-ink/50 hover:text-ink"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="p-8 text-center text-ink/50 font-mono text-xs">Loading...</div>
          ) : currentLivreurs.length === 0 ? (
            <div className="p-8 text-center text-ink/50 font-mono text-xs">
              {searchTerm || filterStatut ? "Aucun livreur ne correspond aux critères" : "Aucun livreur trouvé."}
            </div>
          ) : (
            currentLivreurs.map((l) => (
              <div key={l.id} className="grid grid-cols-[60px_2fr_2fr_120px_1fr_100px_100px] border-b border-line hover:bg-[#F8F8F7] transition-colors cursor-pointer group">
                {isEditing === l.id ? (
                  <>
                    <div className="data-cell font-mono text-xs text-ink/70">#{l.id}</div>
                    <div className="data-cell"><input type="text" className="input-theme !p-1" defaultValue={l.nom} onChange={e => setEditForm({...editForm, nom: e.target.value})} /></div>
                    <div className="data-cell"><input type="text" className="input-theme !p-1" defaultValue={l.prenom} onChange={e => setEditForm({...editForm, prenom: e.target.value})} /></div>
                    <div className="data-cell"><input type="text" className="input-theme !p-1" defaultValue={l.telephone} onChange={e => setEditForm({...editForm, telephone: e.target.value})} /></div>
                    <div className="data-cell"><input type="text" className="input-theme !p-1" defaultValue={l.zone_secteur} onChange={e => setEditForm({...editForm, zone_secteur: e.target.value})} /></div>
                    <div className="data-cell">
                      <select className="input-theme !p-1" onChange={e => setEditForm({...editForm, statut: e.target.value})} defaultValue={l.statut}>
                        <option value="disponible">disponible</option>
                        <option value="en_livraison">en livraison</option>
                        <option value="actif">actif</option>
                        <option value="inactif">inactif</option>
                        <option value="repos">repos</option>
                        <option value="en_conge">en congé</option>
                      </select>
                    </div>
                    <div className="data-cell justify-end gap-2 border-r-0">
                      <button onClick={() => handleSave(l.id)} className="text-[#228B22]"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setIsEditing(null); setEditForm({}); }} className="text-ink/50 hover:text-ink"><X className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="data-cell font-mono text-xs text-ink/70">#{l.id}</div>
                    <div className="data-cell font-bold">{l.nom}</div>
                    <div className="data-cell text-ink/80">{l.prenom}</div>
                    <div className="data-cell font-mono text-[12px]">{l.telephone}</div>
                    <div className="data-cell font-mono text-[11px] truncate">{l.zone_secteur || '-'}</div>
                    <div className="data-cell">
                      <span className={`status-pill 
                        ${l.statut === 'disponible' || l.statut === 'actif' ? 'status-ok' : 
                          l.statut === 'en_livraison' ? 'status-warn' : 
                          l.statut === 'repos' ? 'status-info' :
                          'bg-[#e0e0e0]'}`}>
                        {l.statut}
                      </span>
                    </div>
                    <div className="data-cell justify-end gap-3 border-r-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setIsEditing(l.id); setEditForm(l); }} className="text-ink hover:text-accent">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="border-t border-line bg-white p-4 flex items-center justify-between shrink-0">
          <div className="text-sm font-mono text-ink/60">
            {getDisplayRange()}
          </div>
          
          <div className="flex gap-2 items-center">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-theme !p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  className={`btn-theme !min-w-[40px] !px-2 ${currentPage === page ? 'btn-theme-primary' : ''}`}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-theme !p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm font-mono text-ink/60">
            Page {currentPage} / {totalPages}
          </div>
        </div>
      )}

      {/* Afficher un message si aucun résultat après filtrage */}
      {!loading && totalItems === 0 && (searchTerm || filterStatut) && (
        <div className="p-8 text-center text-ink/50 font-mono text-xs border-t border-line">
          Aucun résultat pour "<strong>{searchTerm}</strong>" {filterStatut && `avec le statut "${filterStatut}"`}
          <button 
            onClick={() => { setSearchTerm(''); setFilterStatut(''); }}
            className="ml-2 text-accent underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}