// controllers/laporanController.js
import { Op } from "sequelize";
import { Barang, BarangMasuk, BarangKeluar } from "../models/index.js";
import { generatePdfReport } from "../utils/pdfGenerator.js";

/**
 * Format date DD-MM-YYYY HH:MM
@param {Date} date 
@returns {string} 
 */
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};


export const generateLaporanBulanan = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        // Validasi bulan dan tahun
        const bulanInt = parseInt(bulan);
        const tahunInt = parseInt(tahun);

        if (isNaN(bulanInt) || bulanInt < 1 || bulanInt > 12 || isNaN(tahunInt)) {
            console.warn(`[generateLaporanBulanan] Invalid month or year: bulan=${bulan}, tahun=${tahun}`);
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

        // Membangun rentang tanggal untuk kueri bulanan
        const startDate = new Date(tahunInt, bulanInt - 1, 1); 
        const endDate = new Date(tahunInt, bulanInt, 0); 

        // --- 1. Laporan Keseluruhan Data ---
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
            formatDate(item.tanggal),
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
            formatDate(item.tanggal),
            item.barang.batas_maksimal.toString(),
        ]);

        // --- 4. Barang Berlebih Stok ---
        // Fetch semua barang yang gak terdelete untuk melihat status semua stok
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


        // --- Data untuk Pdf generator ---
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
