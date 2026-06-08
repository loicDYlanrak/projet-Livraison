import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import pkg from 'pg';
import { createServer as createViteServer } from "vite";

const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(cors());
app.use(express.json());

// Basic API Key Authentication Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!process.env.API_KEY || process.env.API_KEY === "") {
     return next(); // If no key is configured, allow (dev mode)
  }
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    return;
  }
  next();
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://airflow:airflow@localhost:5432/warehouse_db",
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  // Continue without crashing
});

async function startServer() {
  
  // ==========================================
  // LIVREUR ROUTES
  // ==========================================
  app.get("/api/livreurs", requireAuth, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM livreur ORDER BY id");
      res.json(result.rows);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Database Error" });
    }
  });

  app.post("/api/livreurs", requireAuth, async (req, res) => {
    const { nom, prenom, telephone, zone_secteur, statut } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO livreur (nom, prenom, telephone, zone_secteur, statut) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [nom, prenom, telephone, zone_secteur, statut || 'disponible']
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/livreurs/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, telephone, zone_secteur, statut } = req.body;
    try {
      const result = await pool.query(
        "UPDATE livreur SET nom = $1, prenom = $2, telephone = $3, zone_secteur = $4, statut = $5 WHERE id = $6 RETURNING *",
        [nom, prenom, telephone, zone_secteur, statut, id]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/livreurs/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM livreur WHERE id = $1", [id]);
      res.json({ message: "Deleted" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // COMMANDE ROUTES
  // ==========================================
  app.get("/api/commandes", requireAuth, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM commande ORDER BY id");
      res.json(result.rows);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/commandes", requireAuth, async (req, res) => {
    const { client_id, statut, montant_total } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO commande (client_id, statut, montant_total) VALUES ($1, $2, $3) RETURNING *",
        [client_id, statut || 'NOUVELLE', montant_total]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // RETOUR ROUTES
  // ==========================================
  app.get("/api/retours", requireAuth, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM retour ORDER BY id_retour");
      res.json(result.rows);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/retours", requireAuth, async (req, res) => {
    const { id_colis, id_client, motif, commentaire, statut } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO retour (id_colis, id_client, motif, commentaire, statut) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [id_colis, id_client, motif, commentaire, statut || 'INITIE']
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // STATUT_LIVRAISON ROUTES
  // ==========================================
  app.get("/api/statuts-livraison", requireAuth, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM statut_livraison ORDER BY id");
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // INCIDENT ROUTES
  // ==========================================
  app.get("/api/incidents", requireAuth, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM incident ORDER BY id");
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
