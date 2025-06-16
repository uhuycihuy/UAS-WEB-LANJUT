import PDFDocument from 'pdfkit';

/**
 * Menghasilkan laporan PDF yang komprehensif dengan beberapa bagian (ringkasan, tabel).
 * @param {object} reportData - Objek yang berisi detail laporan.
 * @param {string} reportData.title - Judul utama laporan.
 * @param {string} reportData.period - Periode laporan (contoh, "PERIODE : JUNI").
 * @param {Array<object>} reportData.sections - array untuk bagian laporan.
 * @returns {Promise<Buffer>} - Promise yang diselesaikan dengan buffer PDF.
 */
export const generatePdfReport = (reportData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 30 
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', (err) => {
            reject(err);
        });

        doc.font('Helvetica');

        /**
         * Helper function untuk teks dalam kapsul (status) 
         * @param {string} text - Ini bagian teksnya.
         * @param {number} x - x-coordinate untuk kotaknya.
         * @param {number} y - y-coordinate untuk kotaknya.
         * @param {number} width - Untuk lebar kotaknya.
         * @param {number} height - Untuk untuk tinggi kotaknya.
         * @param {number} radius - Radius ujung kotaknya.
         * @param {string} fillColor - untuk warna kotaknya.
         * @param {string} textColor - Warna teksnya.
         */
        const drawCapsuleText = (text, x, y, width, height, radius, fillColor, textColor) => {
            doc.save(); 
            doc.roundedRect(x, y, width, height, radius)
               .fill(fillColor);
            doc.fillColor(textColor)
               .fontSize(8); 
            const textY = y + (height - doc.heightOfString(text, { width: width - 2 * radius, align: 'center' })) / 2;
            doc.text(text, x + radius, textY, { 
                width: width - 2 * radius, 
                align: 'center',
                valign: 'center' 
            });
            doc.restore(); 
        };

        // --- Judul Laporan Utama dan Periode ---
        doc.fontSize(16)
           .text(reportData.title, { align: 'center' })
           .moveDown(0.5);

        if (reportData.period) {
            doc.fontSize(12)
               .text(reportData.period, { align: 'center' })
               .moveDown(1.5);
        }

        // --- Pengulangan melalui bagian  ---
        reportData.sections.forEach(section => {
            const minSpaceNeeded = (section.type === 'summary') ? 100 : 150;
            if (doc.y + minSpaceNeeded > doc.page.height - doc.page.margins.bottom && doc.y > doc.page.margins.top + 10) {
                doc.addPage();
            }

            // --- Render Bagian Judul ( BARANG MASUK, BARANG KELUAR) ---
            doc.fontSize(14)
               .fillColor('#333');
            doc.text(section.title.toUpperCase(), doc.page.margins.left, doc.y, {
                width: doc.page.width - 2 * doc.page.margins.left,
                align: 'center'
            })
            .moveDown(1);

            if (section.type === 'summary' && section.summaryData) {
                // --- Render Bagian Laporan ---
                const totalSummaryWidth = section.summaryData.length * 140 + (section.summaryData.length - 1) * 20;
                const summaryStartX = (doc.page.width - totalSummaryWidth) / 2;
                let currentSummaryX = summaryStartX;
                const summaryBlockWidth = 140;
                const summaryHeight = 60;
                const summaryPadding = 10;
                const gap = 20;
                const initialY = doc.y;

                section.summaryData.forEach((item, index) => {
                    if (initialY + summaryHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        currentSummaryX = summaryStartX;
                        initialY = doc.page.margins.top;
                    }

                    doc.rect(currentSummaryX, initialY, summaryBlockWidth, summaryHeight)
                       .fill('#F0F0F0')
                       .stroke('#CCC');

                    doc.fontSize(9)
                       .fillColor('#666');
                    const labelTextHeight = doc.heightOfString(item.label, { width: summaryBlockWidth - 2 * summaryPadding, align: 'center' });
                    const labelY = initialY + summaryPadding;
                    doc.text(item.label, currentSummaryX + summaryPadding, labelY, {
                        width: summaryBlockWidth - 2 * summaryPadding,
                        align: 'center',
                        height: labelTextHeight
                    });

                    doc.fontSize(18)
                       .fillColor('#000')
                       .font('Helvetica-Bold');
                    const valueTextHeight = doc.heightOfString(item.value, { width: summaryBlockWidth - 2 * summaryPadding, align: 'center' });
                    const valueY = labelY + labelTextHeight + 5;
                    doc.text(item.value, currentSummaryX + summaryPadding, valueY, {
                        width: summaryBlockWidth - 2 * summaryPadding,
                        align: 'center',
                        height: summaryHeight - (valueY - initialY) - summaryPadding
                    });
                    doc.font('Helvetica');

                    currentSummaryX += summaryBlockWidth + gap;
                });
                doc.y = initialY + summaryHeight;
                doc.moveDown(2);

            } else if (section.type === 'table' && section.headers && section.data) {
                // --- Render Table  ---
                const startX = doc.page.margins.left;
                let startY = doc.y;
                const rowHeight = 25;
                const columnCount = section.headers.length;
                const tableWidth = doc.page.width - 2 * startX;
                const columnWidth = tableWidth / columnCount;

                // Fungsi untuk menggambar baris header dan data
                const drawTableRow = (cells, isHeader = false) => {
                    if (startY + rowHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        startY = doc.page.margins.top;
                        if (!isHeader) {
                            drawTableRow(section.headers, true);
                            startY = doc.y;
                        }
                    }

                    if (isHeader) {
                        doc.fillColor('#F8FAFC')
                           .rect(startX, startY, tableWidth, rowHeight)
                           .fill();
                        doc.strokeColor('#FFF');
                    } else {
                        doc.fillColor('#FFF')
                           .rect(startX, startY, tableWidth, rowHeight)
                           .fill();
                        doc.strokeColor('#EEE');
                    }

                    cells.forEach((cell, i) => {
                        const cellX = startX + i * columnWidth;
                        doc.lineWidth(0.5)
                           .lineCap('butt')
                           .moveTo(cellX, startY)
                           .lineTo(cellX, startY + rowHeight)
                           .stroke();

                        // Handling untuk kolom 'STATUS' 
                        if (section.headers[i] === 'STATUS' && !isHeader) {
                            let fillColor, textColor;
                            const statusText = cell.toLowerCase();
                            const capsulePadding = 8; 
                            const textWidth = doc.widthOfString(cell, { fontSize: 8 });
                            const capsuleWidth = textWidth + 2 * capsulePadding;
                            const capsuleHeight = rowHeight - 10; 
                            const capsuleX = cellX + (columnWidth - capsuleWidth) / 2; 
                            const capsuleY = startY + (rowHeight - capsuleHeight) / 2; 

                            if (statusText === 'aman') {
                                fillColor = '#D4EDDA'; 
                                textColor = '#155724'; 
                            } else if (statusText === 'kurang' || statusText === 'habis') {
                                fillColor = '#F8D7DA'; 
                                textColor = '#721C24'; 
                            } else if (statusText === 'berlebih') {
                                fillColor = '#FFF3CD'; 
                                textColor = '#856404'; 
                            } else {
                                fillColor = '#FFFFFF'; 
                                textColor = '#000000'; 
                            }
                            drawCapsuleText(cell, capsuleX, capsuleY, capsuleWidth, capsuleHeight, capsuleHeight / 2, fillColor, textColor); // Use height/2 for perfect capsule
                        } else {
                            // Standard text rendering
                            let currentTextColor;
                            if (isHeader) {
                                currentTextColor = '#64748B'; 
                            } else {
                                if (section.headers[i] === 'KODE BARANG') {
                                    currentTextColor = '#1E40AF'; 
                                } else {
                                    currentTextColor = '#000000'; 
                                }
                            }

                            doc.fillColor(currentTextColor)
                               .fontSize(8);
                            doc.text(cell, cellX + 5, startY + 8, {
                                width: columnWidth - 10,
                                align: isHeader ? 'center' : 'left',
                                lineBreak: false,
                                ellipsis: true
                            });
                        }
                    });

                    doc.lineWidth(0.5)
                       .strokeColor('#EEE')
                       .moveTo(startX, startY + rowHeight)
                       .lineTo(startX + tableWidth, startY + rowHeight)
                       .stroke();

                    startY += rowHeight;
                };

                doc.font('Helvetica-Bold');
                drawTableRow(section.headers, true);
                doc.font('Helvetica');

                section.data.forEach(row => {
                    drawTableRow(row);
                });

                if (section.footerSummary && section.footerSummary.length > 0) {
                    if (startY + 40 > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        startY = doc.page.margins.top;
                    }

                    doc.rect(startX, startY, tableWidth, rowHeight)
                       .fill('#F8FAFC')
                       .stroke('#EEE');

                    let currentFooterX = startX;
                    const footerColWidth = tableWidth / section.footerSummary.length;

                    doc.font('Helvetica-Bold')
                       .fontSize(9);
                    section.footerSummary.forEach(item => {
                        doc.fillColor('#000000');
                        doc.text(item.label, currentFooterX + 5, startY + 8, {
                            width: footerColWidth - 10,
                            align: 'left'
                        });
                        doc.text(item.value, currentFooterX + 5, startY + 8, {
                            width: footerColWidth - 10,
                            align: 'right'
                        });
                        currentFooterX += footerColWidth;
                    });
                    doc.font('Helvetica');
                    startY += rowHeight;
                }
                doc.moveDown(2);
            }
        });

        doc.end();
    });
};
