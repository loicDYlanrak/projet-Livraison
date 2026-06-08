import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Commande } from "../types.ts";
import { apiClient } from "../App.tsx";

export default function CommandesView() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Commande>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/commandes");
      setCommandes(data);
      setError("");
    } catch (e: any) {
      setError("Connection refused: ensure Postgres container is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, []);
  
  const [selectedCmd, setSelectedCmd] = useState<Commande | null>(null);
  
  const handleSave = async () => {
    try {
      await apiClient.post("/api/commandes", editForm);
      setIsCreating(false);
      setEditForm({});
      fetchCommandes();
    } catch (e: any) {
      alert(e.message);
    }
  };
  
  const getStatusClass = (statut: string) => {
    switch (statut) {
      case "NOUVELLE":
        return "status-info";
      case "EN_PREPARATION":
        return "status-warn";
      case "EXPEDIEE":
        return "bg-[#B2DFDB]";
      case "LIVREE":
        return "status-ok";
      case "INCIDENT":
        return "status-error";
      default:
        return "bg-[#e0e0e0]";
    }
  };
  
  console.log("Commandes: ", commandes);
  
  // Fonction utilitaire pour formater les dates en toute sécurité
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      return date.toISOString().split("T")[0];
    } catch (error) {
      return "Date invalide";
    }
  };

  // Filtrer les commandes
  const filteredCommandes = commandes.filter(cmd => {
    const matchSearch = searchTerm === "" || 
      cmd.destinataire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.id?.toString().includes(searchTerm) ||
      cmd.code_suivi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatut = filterStatut === "" || cmd.statut === filterStatut;
    
    return matchSearch && matchStatut;
  });

  // Pagination calculations
  const totalItems = filteredCommandes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommandes = filteredCommandes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatut]);

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

  return (
    <div className="flex h-full bg-white">
      {/* Main List Area */}
      <div className="flex-col flex-1 overflow-auto flex">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-line bg-white sticky top-0 z-10">
          <div className="flex gap-4 items-center">
            <select
              className="input-theme w-48"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="NOUVELLE">NOUVELLE</option>
              <option value="EN_PREPARATION">EN PREPARATION</option>
              <option value="EXPEDIEE">EXPEDIEE</option>
              <option value="LIVREE">LIVREE</option>
              <option value="INCIDENT">INCIDENT</option>
            </select>
            <select
              className="input-theme w-32"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[60px_1fr_100px_120px_100px] border-b-2 border-line sticky top-[73px] bg-white z-10">
          <div className="col-header">ID</div>
          <div className="col-header">Client ID / Ref</div>
          <div className="col-header">Date</div>
          <div className="col-header">Statut</div>
          <div className="col-header border-r-0">Montant</div>
        </div>

        {error && (
          <div className="p-3 m-4 bg-[#EF9A9A] text-ink border border-line font-mono text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col mb-auto">
          {loading ? (
            <div className="p-8 text-center text-ink/50 font-mono text-xs">
              Loading...
            </div>
          ) : currentCommandes.length === 0 ? (
            <div className="p-8 text-center text-ink/50 font-mono text-xs">
              Aucune commande trouvée
            </div>
          ) : (
            currentCommandes.map((cmd) => (
              <div
                key={cmd.id}
                onClick={() => setSelectedCmd(cmd)}
                className={`grid grid-cols-[60px_1fr_100px_120px_100px] border-b border-line hover:bg-[#F8F8F7] transition-colors cursor-pointer
                ${selectedCmd?.id === cmd.id ? "bg-[#F8F8F7] font-bold" : ""}`}
              >
                <div className="data-cell font-mono text-[12px]">#{cmd.id}</div>
                <div className="data-cell">Client: {cmd.destinataire}</div>
                <div className="data-cell font-mono text-[12px]">
                  {formatDate(cmd.date_expedition)}
                </div>
                <div className="data-cell">
                  <span className={`status-pill ${getStatusClass(cmd.statut)}`}>
                    {cmd.statut}
                  </span>
                </div>
                <div className="data-cell font-mono text-[12px] border-r-0">
                  {Number(cmd.montant_ttc).toFixed(2)}€
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="border-t border-line bg-white p-4 flex items-center justify-between shrink-0">
            <div className="text-sm font-mono text-ink/60">
              {startIndex + 1} - {Math.min(endIndex, totalItems)} sur {totalItems} commandes
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

        <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)]"></div>

        <div className="p-[15px] border-t border-line flex gap-2 justify-end bg-white shrink-0">
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedCmd(null);
              editForm.statut = "NOUVELLE";
            }}
            className="btn-theme"
          >
            + Nouvelle Commande
          </button>
          <button className="btn-theme btn-theme-primary">Export CSV</button>
        </div>
      </div>

      {/* Detail Panel */}
      <aside className="w-[300px] border-left-2 border-l-2 border-line p-5 bg-base flex flex-col shrink-0 overflow-y-auto">
        <h3 className="m-0 mb-5 font-serif italic text-[20px]">
          {isCreating ? "Nouvelle Commande" : "Détail Entité"}
        </h3>

        {isCreating ? (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <label className="field-label">CLIENT_ID</label>
              <input
                type="number"
                className="input-theme"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    client_id: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="mb-4">
              <label className="field-label">MONTANT TOTAL (EUR)</label>
              <input
                type="number"
                step="0.01"
                className="input-theme"
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    montant_total: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="mb-4">
              <label className="field-label">STATUT</label>
              <select
                className="input-theme"
                onChange={(e) =>
                  setEditForm({ ...editForm, statut: e.target.value })
                }
                defaultValue="NOUVELLE"
              >
                <option value="NOUVELLE">NOUVELLE</option>
                <option value="EN_PREPARATION">EN PREPARATION</option>
                <option value="EXPEDIEE">EXPEDIEE</option>
                <option value="LIVREE">LIVREE</option>
              </select>
            </div>

            <div className="mt-auto flex gap-2 pt-4">
              <button
                className="btn-theme flex-1 border-[#EF9A9A] text-[#D32F2F]"
                onClick={() => setIsCreating(false)}
              >
                ANNULER
              </button>
              <button
                className="btn-theme btn-theme-primary flex-1"
                onClick={handleSave}
              >
                ENREGISTRER
              </button>
            </div>
          </div>
        ) : selectedCmd ? (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <label className="field-label">ID COMMANDE</label>
              <input
                type="text"
                className="input-theme !bg-white/50 text-ink/70"
                value={`CMD-${selectedCmd.id.toString().padStart(4, "0")}`}
                readOnly
              />
            </div>
            <div className="mb-4">
              <label className="field-label">CLIENT_ID</label>
              <input
                type="number"
                className="input-theme"
                defaultValue={selectedCmd.client_id}
              />
            </div>
            <div className="mb-4">
              <label className="field-label">MONTANT TOTAL (EUR)</label>
              <input
                type="number"
                step="0.01"
                className="input-theme"
                defaultValue={selectedCmd.montant_total}
              />
            </div>
            <div className="mb-4">
              <label className="field-label">STATUT</label>
              <select className="input-theme" defaultValue={selectedCmd.statut}>
                <option value="NOUVELLE">NOUVELLE</option>
                <option value="EN_PREPARATION">EN PREPARATION</option>
                <option value="EXPEDIEE">EXPEDIEE</option>
                <option value="LIVREE">LIVREE</option>
                <option value="INCIDENT">INCIDENT</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">LOGS ACTIVITÉ</label>
              <div className="font-mono text-[10px] bg-[#e0e0e0] p-[10px] border border-line text-ink/80 opacity-70">
                {formatDate(selectedCmd.created_at)} - CREATED
                <br />
                {selectedCmd.updated_at !== selectedCmd.created_at && (
                  <>
                    {formatDate(selectedCmd.updated_at)} - UPDATED
                    <br />
                  </>
                )}
                <em>(System logs mock)</em>
              </div>
            </div>

            <div className="mt-auto flex gap-2 pt-4">
              <button className="btn-theme flex-1 border-[#EF9A9A] text-[#D32F2F]">
                SUPPRIMER
              </button>
              <button className="btn-theme btn-theme-primary flex-1">
                ENREGISTRER
              </button>
            </div>
          </div>
        ) : (
          <div className="text-ink/40 text-center font-mono text-xs my-auto">
            Select a commande
            <br />
            to view details.
          </div>
        )}
      </aside>
    </div>
  );
}