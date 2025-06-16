// routes/laporanRoutes.js
import express from "express";
import {
    generateLaporanBulanan,
} from "../controllers/LaporanController.js";

const router = express.Router();

// Route untuk mencetak keseluruhan laporan 
router.get("/bulanan/:bulan/:tahun", generateLaporanBulanan);


export default router;
