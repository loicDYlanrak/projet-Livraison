// backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: 'warehouse', // Défaut sur le schéma warehouse
});

// Test de connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.stack);
  } else {
    console.log('✅ Connecté à PostgreSQL - Schéma warehouse');
    release();
  }
});

// ============ ROUTES LIVREURS ============

// GET - Récupérer tous les livreurs
app.get('/api/livreurs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_dim_livreur as id,
        id_source,
        nom,
        prenom,
        nom_complet,
        telephone,
        zone_secteur as secteur,
        statut
      FROM warehouse.dim_livreur 
      ORDER BY id_dim_livreur
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Récupérer un livreur par ID
app.get('/api/livreurs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id_dim_livreur as id,
        id_source,
        nom,
        prenom,
        nom_complet,
        telephone,
        zone_secteur as secteur,
        statut
      FROM warehouse.dim_livreur 
      WHERE id_dim_livreur = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Créer un nouveau livreur
app.post('/api/livreurs', async (req, res) => {
  const { nom, prenom, telephone, secteur, statut } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO warehouse.dim_livreur 
        (nom, prenom, nom_complet, telephone, zone_secteur, statut) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id_dim_livreur as id
    `, [nom, prenom, `${prenom} ${nom}`, telephone, secteur, statut || 'actif']);
    res.status(201).json({ 
      id: result.rows[0].id,
      nom, prenom, telephone, secteur, statut 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mettre à jour un livreur
app.put('/api/livreurs/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, telephone, secteur, statut } = req.body;
  try {
    const result = await pool.query(`
      UPDATE warehouse.dim_livreur 
      SET nom=$1, prenom=$2, nom_complet=$3, telephone=$4, zone_secteur=$5, statut=$6 
      WHERE id_dim_livreur = $7 
      RETURNING id_dim_livreur as id
    `, [nom, prenom, `${prenom} ${nom}`, telephone, secteur, statut, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }
    res.json({ id, nom, prenom, telephone, secteur, statut });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Supprimer un livreur
app.delete('/api/livreurs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      DELETE FROM warehouse.dim_livreur 
      WHERE id_dim_livreur = $1 
      RETURNING id_dim_livreur
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }
    res.json({ message: 'Livreur supprimé avec succès', id: parseInt(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTES COMMANDES (LIVRAISONS) ============

// GET - Récupérer toutes les livraisons
app.get('/api/commandes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fl.id_fait_livraison as id,
        fl.statut_livraison as statut,
        fl.montant_ttc,
        fl.frais_livraison,
        fl.poids_kg,
        fl.delai_livraison_jours,
        fl.livraison_dans_delai,
        dc.code_suivi,
        dc.type_colis,
        dc.destinataire,
        dl.nom as livreur_nom,
        dl.prenom as livreur_prenom,
        dt_exp.date_complete as date_expedition,
        dt_liv.date_complete as date_livraison,
        dg_depart.ville as ville_depart,
        dg_arrivee.ville as ville_arrivee
      FROM warehouse.fait_livraison fl
      LEFT JOIN warehouse.dim_colis dc ON fl.id_dim_colis = dc.id_dim_colis
      LEFT JOIN warehouse.dim_livreur dl ON fl.id_dim_livreur = dl.id_dim_livreur
      LEFT JOIN warehouse.dim_temps dt_exp ON fl.id_dim_temps_expedition = dt_exp.id_dim_temps
      LEFT JOIN warehouse.dim_temps dt_liv ON fl.id_dim_temps_livraison = dt_liv.id_dim_temps
      LEFT JOIN warehouse.dim_geo dg_depart ON fl.id_dim_geo_depart = dg_depart.id_dim_geo
      LEFT JOIN warehouse.dim_geo dg_arrivee ON fl.id_dim_geo_arrivee = dg_arrivee.id_dim_geo
      ORDER BY fl.id_fait_livraison DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Récupérer une livraison par ID
app.get('/api/commandes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        fl.*,
        dc.code_suivi,
        dc.type_colis,
        dc.destinataire,
        dl.nom as livreur_nom,
        dl.prenom as livreur_prenom,
        dt_exp.date_complete as date_expedition,
        dt_liv.date_complete as date_livraison
      FROM warehouse.fait_livraison fl
      LEFT JOIN warehouse.dim_colis dc ON fl.id_dim_colis = dc.id_dim_colis
      LEFT JOIN warehouse.dim_livreur dl ON fl.id_dim_livreur = dl.id_dim_livreur
      LEFT JOIN warehouse.dim_temps dt_exp ON fl.id_dim_temps_expedition = dt_exp.id_dim_temps
      LEFT JOIN warehouse.dim_temps dt_liv ON fl.id_dim_temps_livraison = dt_liv.id_dim_temps
      WHERE fl.id_fait_livraison = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Créer une nouvelle livraison
app.post('/api/commandes', async (req, res) => {
  const { 
    code_suivi, type_colis, poids_kg, destinataire,
    ville_depart, ville_arrivee, frais_livraison, montant_ttc 
  } = req.body;
  
  try {
    // Démarrer une transaction
    await pool.query('BEGIN');
    
    // Créer ou récupérer le colis
    const colisResult = await pool.query(`
      INSERT INTO warehouse.dim_colis (code_suivi, type_colis, poids_kg, destinataire)
      VALUES ($1, $2, $3, $4)
      RETURNING id_dim_colis
    `, [code_suivi, type_colis, poids_kg, destinataire]);
    
    // Récupérer les IDs géographiques
    const geoDepart = await pool.query(`
      SELECT id_dim_geo FROM warehouse.dim_geo WHERE ville = $1
    `, [ville_depart]);
    
    const geoArrivee = await pool.query(`
      SELECT id_dim_geo FROM warehouse.dim_geo WHERE ville = $1
    `, [ville_arrivee]);
    
    // Récupérer la date du jour
    const dateResult = await pool.query(`
      SELECT id_dim_temps FROM warehouse.dim_temps 
      WHERE date_complete = CURRENT_DATE
    `);
    
    // Créer la livraison
    const livraisonResult = await pool.query(`
      INSERT INTO warehouse.fait_livraison (
        id_dim_temps_expedition,
        id_dim_colis,
        id_dim_geo_depart,
        id_dim_geo_arrivee,
        frais_livraison,
        montant_ttc,
        poids_kg,
        statut_livraison
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_fait_livraison as id
    `, [
      dateResult.rows[0]?.id_dim_temps || 1,
      colisResult.rows[0].id_dim_colis,
      geoDepart.rows[0]?.id_dim_geo || 1,
      geoArrivee.rows[0]?.id_dim_geo || 1,
      frais_livraison,
      montant_ttc,
      poids_kg,
      'En préparation'
    ]);
    
    await pool.query('COMMIT');
    res.status(201).json({ id: livraisonResult.rows[0].id, ...req.body });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mettre à jour le statut d'une livraison
app.put('/api/commandes/:id/statut', async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  try {
    const result = await pool.query(`
      UPDATE warehouse.fait_livraison 
      SET statut_livraison = $1 
      WHERE id_fait_livraison = $2 
      RETURNING id_fait_livraison
    `, [statut, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ id, statut });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTES STATISTIQUES ============

app.get('/api/stats', async (req, res) => {
  try {
    const livreursCount = await pool.query('SELECT COUNT(*) FROM warehouse.dim_livreur');
    const commandesCount = await pool.query('SELECT COUNT(*) FROM warehouse.fait_livraison');
    const commandesEncours = await pool.query(`
      SELECT COUNT(*) FROM warehouse.fait_livraison 
      WHERE statut_livraison IN ('En transit', 'En préparation')
    `);
    const commandesLivrees = await pool.query(`
      SELECT COUNT(*) FROM warehouse.fait_livraison 
      WHERE statut_livraison = 'Livré'
    `);
    
    // Chiffre d'affaires total
    const caTotal = await pool.query(`
      SELECT COALESCE(SUM(montant_ttc), 0) as total 
      FROM warehouse.fait_livraison 
      WHERE statut_livraison = 'Livré'
    `);
    
    // Poids total livré
    const poidsTotal = await pool.query(`
      SELECT COALESCE(SUM(poids_kg), 0) as total 
      FROM warehouse.fait_livraison
    `);
    
    res.json({
      total_livreurs: parseInt(livreursCount.rows[0].count),
      total_commandes: parseInt(commandesCount.rows[0].count),
      commandes_en_cours: parseInt(commandesEncours.rows[0].count),
      commandes_livrees: parseInt(commandesLivrees.rows[0].count),
      chiffre_affaires: parseFloat(caTotal.rows[0].total),
      poids_total_kg: parseFloat(poidsTotal.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTES RETOURS ============

app.get('/api/retours', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fr.id_fait_retour as id,
        fr.motif_retour,
        fr.commentaire,
        fr.montant_ttc_retourne,
        fr.frais_retour,
        fr.delai_retour_jours,
        dc.code_suivi,
        dc.type_colis,
        dc.destinataire,
        dt.date_complete as date_retour,
        dg.ville as ville_retour
      FROM warehouse.fait_retour fr
      LEFT JOIN warehouse.dim_colis dc ON fr.id_dim_colis = dc.id_dim_colis
      LEFT JOIN warehouse.dim_temps dt ON fr.id_dim_temps_retour = dt.id_dim_temps
      LEFT JOIN warehouse.dim_geo dg ON fr.id_dim_geo_retour = dg.id_dim_geo
      ORDER BY fr.id_fait_retour DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTES INCIDENTS ============

app.get('/api/incidents', async (req, res) => {
  try {
    // Note: La table incidents existe dans votre schéma
    const result = await pool.query(`
      SELECT 
        i.*,
        dc.code_suivi,
        dt.date_complete as date_incident
      FROM warehouse.incidents i
      LEFT JOIN warehouse.dim_colis dc ON i.commande_id = dc.id_dim_colis
      LEFT JOIN warehouse.dim_temps dt ON i.date_incident::date = dt.date_complete
      ORDER BY i.date_incident DESC
    `);
    res.json(result.rows);
  } catch (err) {
    // Si la table n'existe pas encore
    res.json([]);
  }
});

// ============ ROUTES GÉOGRAPHIQUES ============

app.get('/api/villes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ville, province, pays 
      FROM warehouse.dim_geo 
      ORDER BY ville
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTES TABLEAU DE BORD ============

app.get('/api/dashboard', async (req, res) => {
  try {
    // Livraisons par statut
    const statsParStatut = await pool.query(`
      SELECT statut_livraison, COUNT(*) as count
      FROM warehouse.fait_livraison
      GROUP BY statut_livraison
    `);
    
    // Livraisons par jour
    const livraisonsParJour = await pool.query(`
      SELECT dt.date_complete, COUNT(fl.id_fait_livraison) as count
      FROM warehouse.fait_livraison fl
      JOIN warehouse.dim_temps dt ON fl.id_dim_temps_expedition = dt.id_dim_temps
      GROUP BY dt.date_complete
      ORDER BY dt.date_complete DESC
      LIMIT 7
    `);
    
    // Top livreurs
    const topLivreurs = await pool.query(`
      SELECT 
        dl.nom_complet,
        COUNT(fl.id_fait_livraison) as nb_livraisons,
        COALESCE(SUM(fl.montant_ttc), 0) as ca_total
      FROM warehouse.dim_livreur dl
      LEFT JOIN warehouse.fait_livraison fl ON dl.id_dim_livreur = fl.id_dim_livreur
      GROUP BY dl.id_dim_livreur, dl.nom_complet
      ORDER BY nb_livraisons DESC
      LIMIT 5
    `);
    
    res.json({
      par_statut: statsParStatut.rows,
      livraisons_par_jour: livraisonsParJour.rows,
      top_livreurs: topLivreurs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`📊 Connecté au schéma warehouse de PostgreSQL`);
});