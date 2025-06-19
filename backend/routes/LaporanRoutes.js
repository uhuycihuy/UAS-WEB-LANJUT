import express from "express";
import {
    generateLaporanBulanan,generateLaporanBulananPreview
} from "../controllers/LaporanController.js";

const router = express.Router();

// Route untuk mencetak keseluruhan laporan 
router.get("/bulanan/:bulan/:tahun", generateLaporanBulanan);

// Route untuk preview laporan bulanan sebelum di download
router.get("/preview/bulanan/:bulan/:tahun", generateLaporanBulananPreview);

export default router;
