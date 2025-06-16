// routes/laporanRoutes.js
import express from "express";
import {
    generateMonthlyInventoryReport,
} from "../controllers/LaporanController.js";

const router = express.Router();

// Route untuk mencetak keseluruhan laporan 
router.get("/bulanan/:bulan/:tahun", generateMonthlyInventoryReport);


export default router;
