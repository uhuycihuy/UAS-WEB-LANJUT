// controllers/laporanController.js
import { Op } from "sequelize";
import { Barang, BarangMasuk, BarangKeluar } from "../models/index.js";
import { generatePdfReport } from "../utils/pdfGenerator.js";

/**
 * Helper function to format date to DD-MM-YYYY HH:MM
 * @param {Date} date - The date object to format.
 * @returns {string} Formatted date and time string.
 */
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Generate a comprehensive monthly inventory report PDF (all data in one PDF).
 * GET /api/laporan/bulanan/:bulan/:tahun
 */
export const generateMonthlyInventoryReport = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        // Validate month and year
        const bulanInt = parseInt(bulan);
        const tahunInt = parseInt(tahun);

        if (isNaN(bulanInt) || bulanInt < 1 || bulanInt > 12 || isNaN(tahunInt)) {
            console.warn(`[generateMonthlyInventoryReport] Invalid month or year: bulan=${bulan}, tahun=${tahun}`);
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka antara 1-12 dan tahun harus valid."
            });
        }

        const monthNames = [
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const periodeString = `PERIODE : ${monthNames[bulanInt].toUpperCase()} ${tahunInt}`;

        // Construct date range for the monthly queries
        const startDate = new Date(tahunInt, bulanInt - 1, 1); // Month is 0-indexed
        const endDate = new Date(tahunInt, bulanInt, 0); // Last day of the month

        // --- 1. Overall Summary Data ---
        const totalBarang = await Barang.count({
            where: { is_deleted: false }
        });
        const totalStok = await Barang.sum('stok', {
            where: { is_deleted: false }
        });

        const overallSummaryData = [
            { label: 'Total Barang', value: totalBarang ? totalBarang.toString() : '0' },
            { label: 'Total Stok', value: totalStok ? totalStok.toString() : '0' }
        ];

        // --- 2. Barang Masuk Data ---
        const barangMasukRecords = await BarangMasuk.findAll({
            where: {
                tanggal: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'batas_maksimal'],
            }],
            order: [['tanggal', 'ASC']],
        });

        const totalJumlahMasuk = barangMasukRecords.reduce((sum, item) => sum + item.jumlah, 0);

        const barangMasukTableData = barangMasukRecords.map((item, index) => [
            (index + 1).toString(),
            item.barang.kode_barang,
            item.barang.nama_barang,
            item.barang.satuan,
            item.jumlah.toString(),
            formatDate(item.tanggal), // Updated to include time
            item.barang.batas_maksimal.toString(),
        ]);

        // --- 3. Barang Keluar Data ---
        const barangKeluarRecords = await BarangKeluar.findAll({
            where: {
                tanggal: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'batas_maksimal'],
            }],
            order: [['tanggal', 'ASC']],
        });

        const totalJumlahKeluar = barangKeluarRecords.reduce((sum, item) => sum + item.jumlah, 0);

        const barangKeluarTableData = barangKeluarRecords.map((item, index) => [
            (index + 1).toString(),
            item.barang.kode_barang,
            item.barang.nama_barang,
            item.barang.satuan,
            item.jumlah.toString(),
            formatDate(item.tanggal), // Updated to include time
            item.barang.batas_maksimal.toString(),
        ]);

        // --- 4. Barang Berlebih Stok ---
        // Fetch all non-deleted barang to determine stock status
        const allBarangForStockCheck = await Barang.findAll({
            where: { is_deleted: false },
            order: [['nama_barang', 'ASC']]
        });

        const barangStokBerlebihRecords = allBarangForStockCheck.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMaksimal = parseInt(barang.batas_maksimal) || 0;
            return stok > batasMaksimal;
        });

        const totalStokBerlebih = barangStokBerlebihRecords.reduce((sum, item) => sum + item.stok, 0);

        const barangStokBerlebihTableData = barangStokBerlebihRecords.map((barang, index) => [
            (index + 1).toString(),
            barang.kode_barang,
            barang.nama_barang,
            barang.satuan,
            barang.stok.toString(),
            barang.batas_minimal.toString(),
            barang.batas_maksimal.toString(),
            "Berlebih"
        ]);

        // --- 5. Barang Kurang Stok ---
        const barangStokKurangRecords = allBarangForStockCheck.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMinimal = parseInt(barang.batas_minimal) || 0;
            return stok < batasMinimal || stok === 0;
        });

        const totalStokKurang = barangStokKurangRecords.reduce((sum, item) => sum + item.stok, 0);

        const barangStokKurangTableData = barangStokKurangRecords.map((barang, index) => [
            (index + 1).toString(),
            barang.kode_barang,
            barang.nama_barang,
            barang.satuan,
            barang.stok.toString(),
            barang.batas_minimal.toString(),
            barang.batas_maksimal.toString(),
            "Kurang"
        ]);


        // --- Prepare report data for PDF generation ---
        const reportSections = [
            {
                type: 'summary',
                title: 'TOTAL KESELURUHAN BARANG',
                summaryData: overallSummaryData
            },
            {
                type: 'table',
                title: 'BARANG MASUK',
                headers: ['NO', 'KODE BARANG', 'NAMA BARANG', 'SATUAN', 'JUMLAH', 'TANGGAL & WAKTU MASUK', 'BATAS MAKSIMAL'],
                data: barangMasukTableData,
                footerSummary: [
                    { label: `TOTAL BARANG MASUK : ${barangMasukRecords.length}`, value: '' },
                    { label: '', value: `TOTAL JUMLAH : ${totalJumlahMasuk}` }
                ]
            },
            {
                type: 'table',
                title: 'BARANG KELUAR',
                headers: ['NO', 'KODE BARANG', 'NAMA BARANG', 'SATUAN', 'JUMLAH', 'TANGGAL & WAKTU KELUAR', 'BATAS MAKSIMAL'],
                data: barangKeluarTableData,
                footerSummary: [
                    { label: `TOTAL BARANG KELUAR : ${barangKeluarRecords.length}`, value: '' },
                    { label: '', value: `TOTAL JUMLAH : ${totalJumlahKeluar}` }
                ]
            },
            {
                type: 'table',
                title: 'BARANG BERLEBIH',
                headers: ['NO', 'KODE BARANG', 'NAMA BARANG', 'SATUAN', 'STOK', 'BATAS MINIMAL', 'BATAS MAKSIMAL', 'STATUS'],
                data: barangStokBerlebihTableData,
                footerSummary: [
                    { label: `TOTAL BARANG BERLEBIH : ${barangStokBerlebihRecords.length}`, value: '' },
                    { label: '', value: `TOTAL STOK : ${totalStokBerlebih}` }
                ]
            },
            {
                type: 'table',
                title: 'BARANG KURANG',
                headers: ['NO', 'KODE BARANG', 'NAMA BARANG', 'SATUAN', 'STOK', 'BATAS MINIMAL', 'BATAS MAKSIMAL', 'STATUS'],
                data: barangStokKurangTableData,
                footerSummary: [
                    { label: `TOTAL BARANG KURANG : ${barangStokKurangRecords.length}`, value: '' },
                    { label: '', value: `TOTAL STOK : ${totalStokKurang}` }
                ]
            },
        ];

        const pdfBuffer = await generatePdfReport({
            title: 'LAPORAN INVENTORY BULANAN',
            period: periodeString,
            sections: reportSections
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_inventory_bulanan_${bulanInt}_${tahunInt}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating monthly inventory report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan inventory bulanan",
            error: error.message
        });
    }
};

/**
 * Generate a report for incoming goods (Barang Masuk).
 * GET /api/laporan/barang-masuk/:bulan/:tahun
 */
export const generateLaporanBarangMasuk = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        // Validate month and year
        const bulanInt = parseInt(bulan);
        const tahunInt = parseInt(tahun);

        if (isNaN(bulanInt) || bulanInt < 1 || bulanInt > 12 || isNaN(tahunInt)) {
            console.warn(`[generateLaporanBarangMasuk] Invalid month or year: bulan=${bulan}, tahun=${tahun}`);
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka antara 1-12 dan tahun harus valid."
            });
        }

        // Construct date range for the query
        const startDate = new Date(tahunInt, bulanInt - 1, 1); // Month is 0-indexed
        const endDate = new Date(tahunInt, bulanInt, 0); // Last day of the month

        const barangMasukData = await BarangMasuk.findAll({
            where: {
                tanggal: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan'],
            }],
            order: [['tanggal', 'ASC']],
        });

        if (barangMasukData.length === 0) {
            console.log(`[generateLaporanBarangMasuk] No data found for month ${bulanInt} year ${tahunInt}`);
            return res.status(404).json({
                success: false,
                message: `Tidak ada data barang masuk untuk bulan ${bulanInt} tahun ${tahunInt}.`
            });
        }

        const reportTitle = `Laporan Barang Masuk Bulan ${bulanInt} Tahun ${tahunInt}`;
        const headers = ['NO', 'TANGGAL & WAKTU', 'KODE BARANG', 'NAMA BARANG', 'JUMLAH', 'SATUAN'];
        const data = barangMasukData.map((item, index) => [
            (index + 1).toString(),
            formatDate(item.tanggal), // Updated to include time
            item.barang.kode_barang,
            item.barang.nama_barang,
            item.jumlah.toString(),
            item.barang.satuan,
        ]);

        const pdfBuffer = await generatePdfReport({
            title: reportTitle,
            sections: [{
                type: 'table',
                title: 'DATA BARANG MASUK',
                headers: headers,
                data: data,
                footerSummary: [] // No specific footer for this simple report
            }]
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_barang_masuk_${bulanInt}_${tahunInt}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating Barang Masuk report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan barang masuk",
            error: error.message
        });
    }
};

/**
 * Generate a report for outgoing goods (Barang Keluar).
 * GET /api/laporan/barang-keluar/:bulan/:tahun
 */
export const generateLaporanBarangKeluar = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        // Validate month and year
        const bulanInt = parseInt(bulan);
        const tahunInt = parseInt(tahun);

        if (isNaN(bulanInt) || bulanInt < 1 || bulanInt > 12 || isNaN(tahunInt)) {
            console.warn(`[generateLaporanBarangKeluar] Invalid month or year: bulan=${bulan}, tahun=${tahun}`);
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka antara 1-12 dan tahun harus valid."
            });
        }

        // Construct date range for the query
        const startDate = new Date(tahunInt, bulanInt - 1, 1); // Month is 0-indexed
        const endDate = new Date(tahunInt, bulanInt, 0); // Last day of the month

        const barangKeluarData = await BarangKeluar.findAll({
            where: {
                tanggal: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan'],
            }],
            order: [['tanggal', 'ASC']],
        });

        if (barangKeluarData.length === 0) {
            console.log(`[generateLaporanBarangKeluar] No data found for month ${bulanInt} year ${tahunInt}`);
            return res.status(404).json({
                success: false,
                message: `Tidak ada data barang keluar untuk bulan ${bulanInt} tahun ${tahunInt}.`
            });
        }

        const reportTitle = `Laporan Barang Keluar Bulan ${bulanInt} Tahun ${tahunInt}`;
        const headers = ['NO', 'TANGGAL & WAKTU', 'KODE BARANG', 'NAMA BARANG', 'JUMLAH', 'SATUAN'];
        const data = barangKeluarData.map((item, index) => [
            (index + 1).toString(),
            formatDate(item.tanggal), // Updated to include time
            item.barang.kode_barang,
            item.barang.nama_barang,
            item.jumlah.toString(),
            item.barang.satuan,
        ]);

        const pdfBuffer = await generatePdfReport({
            title: reportTitle,
            sections: [{
                type: 'table',
                title: 'DATA BARANG KELUAR',
                headers: headers,
                data: data,
                footerSummary: [] // No specific footer for this simple report
            }]
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_barang_keluar_${bulanInt}_${tahunInt}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating Barang Keluar report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan barang keluar",
            error: error.message
        });
    }
};

/**
 * Generate a comprehensive stock report (all stock with status).
 * GET /api/laporan/stok
 */
export const generateLaporanStok = async (req, res) => {
    try {
        console.log("[generateLaporanStok] Request received for stock report.");

        const allBarang = await Barang.findAll({
            where: { is_deleted: false },
            order: [['nama_barang', 'ASC']]
        });

        if (allBarang.length === 0) {
            console.log("[generateLaporanStok] No barang data found for stock report.");
            return res.status(404).json({
                success: false,
                message: "Tidak ada data barang untuk laporan stok."
            });
        }

        const reportTitle = "Laporan Stok Barang Keseluruhan";
        const headers = ['NO', 'KODE BARANG', 'NAMA BARANG', 'STOK SAAT INI', 'BATAS MINIMAL', 'BATAS MAKSIMAL', 'STATUS'];
        
        const data = allBarang.map((barang, index) => {
            const stok = parseInt(barang.stok) || 0;
            const batasMinimal = parseInt(barang.batas_minimal) || 0;
            const batasMaksimal = parseInt(barang.batas_maksimal) || 0;
            
            let status = "Aman";
            if (stok === 0) {
                status = "Habis";
            } else if (stok < batasMinimal) {
                status = "Kurang";
            } else if (stok > batasMaksimal) {
                status = "Berlebih";
            }

            return [
                (index + 1).toString(),
                barang.kode_barang,
                barang.nama_barang,
                stok.toString(),
                batasMinimal.toString(),
                batasMaksimal.toString(),
                status
            ];
        });

        const pdfBuffer = await generatePdfReport({
            title: reportTitle,
            sections: [{
                type: 'table',
                title: 'DATA STOK BARANG',
                headers: headers,
                data: data,
                footerSummary: [] // No specific footer for this simple report
            }]
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_stok_barang_keseluruhan.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating Stok report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan stok",
            error: error.message
        });
    }
};

/**
 * Generate a report for understock items (Barang Kurang Stok).
 * GET /api/laporan/stok-kurang
 */
export const generateLaporanStokKurang = async (req, res) => {
    try {
        console.log("[generateLaporanStokKurang] Request received for understock report.");

        const allBarang = await Barang.findAll({
            where: { is_deleted: false },
            order: [['nama_barang', 'ASC']]
        });

        const barangStokKurangRecords = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMinimal = parseInt(barang.batas_minimal) || 0;
            return stok < batasMinimal || stok === 0;
        });

        if (barangStokKurangRecords.length === 0) {
            console.log("[generateLaporanStokKurang] No understock barang data found.");
            return res.status(404).json({
                success: false,
                message: "Tidak ada data barang dengan stok kurang."
            });
        }

        const reportTitle = "Laporan Stok Barang Kurang";
        const headers = ['NO', 'KODE BARANG', 'NAMA BARANG', 'STOK SAAT INI', 'BATAS MINIMAL', 'STATUS'];
        
        const data = barangStokKurangRecords.map((barang, index) => [
            (index + 1).toString(),
            barang.kode_barang,
            barang.nama_barang,
            barang.stok.toString(),
            barang.batas_minimal.toString(),
            "Kurang"
        ]);

        const pdfBuffer = await generatePdfReport({
            title: reportTitle,
            sections: [{
                type: 'table',
                title: 'DATA BARANG DENGAN STOK KURANG',
                headers: headers,
                data: data,
                footerSummary: []
            }]
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_stok_kurang.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating Understock report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan stok barang kurang",
            error: error.message
        });
    }
};

/**
 * Generate a report for overstock items (Barang Berlebih Stok).
 * GET /api/laporan/stok-berlebih
 */
export const generateLaporanStokBerlebih = async (req, res) => {
    try {
        console.log("[generateLaporanStokBerlebih] Request received for overstock report.");

        const allBarang = await Barang.findAll({
            where: { is_deleted: false },
            order: [['nama_barang', 'ASC']]
        });

        const barangStokBerlebihRecords = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMaksimal = parseInt(barang.batas_maksimal) || 0;
            return stok > batasMaksimal;
        });

        if (barangStokBerlebihRecords.length === 0) {
            console.log("[generateLaporanStokBerlebih] No overstock barang data found.");
            return res.status(404).json({
                success: false,
                message: "Tidak ada data barang dengan stok berlebih."
            });
        }

        const reportTitle = "Laporan Stok Barang Berlebih";
        const headers = ['NO', 'KODE BARANG', 'NAMA BARANG', 'STOK SAAT INI', 'BATAS MAKSIMAL', 'STATUS'];
        
        const data = barangStokBerlebihRecords.map((barang, index) => [
            (index + 1).toString(),
            barang.kode_barang,
            barang.nama_barang,
            barang.stok.toString(),
            barang.batas_maksimal.toString(),
            "Berlebih"
        ]);

        const pdfBuffer = await generatePdfReport({
            title: reportTitle,
            sections: [{
                type: 'table',
                title: 'DATA BARANG DENGAN STOK BERLEBIH',
                headers: headers,
                data: data,
                footerSummary: []
            }]
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan_stok_berlebih.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating Overstock report:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat laporan stok barang berlebih",
            error: error.message
        });
    }
};
