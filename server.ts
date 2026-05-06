import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Mock Data ---
interface Agency {
  id: string;
  name: string;
  logo: string;
  rating: number;
}

interface Journey {
  id: string;
  agencyId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatsRemaining: number;
  class: "VIP" | "Classique";
}

const agencies: Agency[] = [
  { id: "1", name: "Danay Express", logo: "🚌", rating: 4.5 },
  { id: "2", name: "Touristique Express", logo: "🦁", rating: 4.8 },
  { id: "3", name: "Amour Mezam", logo: "❤️", rating: 4.2 },
  { id: "4", name: "Buca Voyages", logo: "💨", rating: 4.6 },
];

const journeys: Journey[] = [
  { id: "j1", agencyId: "1", from: "Maroua", to: "Garoua", departureTime: "06:00", arrivalTime: "09:30", price: 3500, seatsRemaining: 12, class: "Classique" },
  { id: "j2", agencyId: "2", from: "Maroua", to: "Garoua", departureTime: "07:30", arrivalTime: "10:45", price: 5000, seatsRemaining: 5, class: "VIP" },
  { id: "j3", agencyId: "1", from: "Maroua", to: "Garoua", departureTime: "14:00", arrivalTime: "17:30", price: 3500, seatsRemaining: 24, class: "Classique" },
  { id: "j4", agencyId: "4", from: "Yaoundé", to: "Douala", departureTime: "08:00", arrivalTime: "12:00", price: 4000, seatsRemaining: 15, class: "Classique" },
  { id: "j5", agencyId: "2", from: "Yaoundé", to: "Douala", departureTime: "10:30", arrivalTime: "14:00", price: 6000, seatsRemaining: 8, class: "VIP" },
  { id: "j6", agencyId: "3", from: "Bafoussam", to: "Yaoundé", departureTime: "05:00", arrivalTime: "10:00", price: 3500, seatsRemaining: 3, class: "Classique" },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  app.get("/api/agencies", (req, res) => {
    res.json(agencies);
  });

  app.get("/api/search", (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Veuillez préciser le départ et l'arrivée." });
    }
    const results = journeys.filter(j => 
      j.from.toLowerCase() === (from as string).toLowerCase() && 
      j.to.toLowerCase() === (to as string).toLowerCase()
    );
    res.json(results);
  });

  app.post("/api/book", (req, res) => {
    const { journeyId, customerName, phone, paymentMethod } = req.body;
    // Simulation simple de réservation
    const journey = journeys.find(j => j.id === journeyId);
    if (!journey) return res.status(404).json({ error: "Trajet non trouvé" });
    
    // Simuler un délai de traitement de paiement
    setTimeout(() => {
      res.json({
        id: `TKT-${Math.random().toString(36).substring(7).toUpperCase()}`,
        status: "CONFIRMED",
        journey,
        customerName,
        phone,
        paymentMethod,
        timestamp: new Date().toISOString()
      });
    }, 1500);
  });

  // --- Vite Middleware for Dev ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
