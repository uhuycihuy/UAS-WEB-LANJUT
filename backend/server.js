import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { logRequest } from './middleware/Log.js';
import { checkAuth } from './middleware/Auth.js';
import { checkIpWhitelist } from './middleware/Ip.js';
import barangRoutes from './routes/BarangRoutes.js';
import barangMasukRoutes from "./routes/BarangMasukRoutes.js";
import barangKeluarRoutes from "./routes/BarangKeluarRoutes.js";
import laporanRoutes from "./routes/LaporanRoutes.js"; // Import new laporan routes
import { syncDatabase } from "./models/index.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(logRequest);
app.use(checkAuth);
app.use(checkIpWhitelist);
syncDatabase();

// API Routes
app.use('/api/barang', barangRoutes);
app.use('/api/barang-masuk', barangMasukRoutes);
app.use('/api/barang-keluar', barangKeluarRoutes);
app.use('/api/laporan', laporanRoutes); // Use new laporan routes

app.listen(PORT, () => {
  console.log(`Server berjalan dengan port ${PORT}`);
});
