export interface Livreur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  zone_secteur: string;
  statut: string;
  created_at: string;
}

export interface Commande {
  id: number;
  client_id: number;
  date_commande: string;
  statut: string;
  montant_total: number;
  created_at: string;
  updated_at: string;
}

export interface StatutLivraison {
  id: number;
  colis_id: number;
  statut: string;
  horodatage: string;
  localisation: string;
}

export interface Incident {
  id: number;
  colis_id: number;
  type_incident: string;
  priorite: string;
  description: string;
  signale_le: string;
  statut: string;
}

export interface Retour {
  id_retour: number;
  id_colis: number;
  id_client: number;
  date_retour: string;
  motif: string;
  commentaire: string;
  statut: string;
  created_at: string;
  updated_at: string;
}
