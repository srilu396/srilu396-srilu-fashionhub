import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, RefreshCw, FileText } from 'lucide-react';
import Button from './Button';
import ExcelJS from 'exceljs';
import { productAPI } from '../../utils/api';
import { useToast } from '../common/Toast/useToast';

const DEFAULT_IMAGE_SET = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
];

const CSV_HEADER_COLUMNS = [
  'Product Name',
  'Description',
  'Category',
  'Subcategory',
  'Selling Price',
  'Original Price',
  'Stock',
  'SKU',
  'Status',
  'Image URLs',
  'Brand',
  'Tags',
  'Size',
  'Color',
  'Featured',
  'Trending'
];

const SAMPLE_CSV_ROW = [
  'Royal Zardozi Velvet Sherwani',
  'Handcrafted embroidered wedding tuxedo sherwani in premium velvet fabric.',
  "Men's Atelier",
  'Sherwanis',
  '125000',
  '150000',
  '15',
  'SH-9901',
  'Active',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b | https://images.unsplash.com/photo-1515886657613-9f3515b0c78f | https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
  'Srilu Couture',
  'Velvet, Wedding, Luxury',
  'M, L, XL',
  'Royal Navy & Gold',
  'True',
  'True'
];

const BulkUploadModal = ({ isOpen, onClose, onSuccess, existingProducts = [] }) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { validRows: [], errorRows: [] }
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, successCount: 0, failCount: 0 });
  const [importDone, setImportDone] = useState(false);

  if (!isOpen) return null;

  // Download CSV Template Option
  const handleDownloadCSVTemplate = () => {
    const csvContent = [
      CSV_HEADER_COLUMNS.join(','),
      SAMPLE_CSV_ROW.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Professional Excel (.xlsx) Template Option using ExcelJS
  const handleDownloadExcelTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SRILU FashionHub';
      workbook.lastModifiedBy = 'SRILU FashionHub Admin';
      workbook.created = new Date();

      // Worksheet 1: Bulk Upload Catalog
      const wsCatalog = workbook.addWorksheet('Bulk Upload Catalog', {
        views: [{ state: 'frozen', ySplit: 4 }]
      });

      // Title Banner Rows 1 & 2
      wsCatalog.mergeCells('A1:P1');
      const titleCell = wsCatalog.getCell('A1');
      titleCell.value = 'SRILU FashionHub';
      titleCell.font = { name: 'Playfair Display', size: 16, bold: true, color: { argb: 'FFD4AF37' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0D10' } };

      wsCatalog.mergeCells('A2:P2');
      const subtitleCell = wsCatalog.getCell('A2');
      subtitleCell.value = 'Bulk Product Upload Template • Fill in inventory specifications below';
      subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FFA0A0AB' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0D10' } };

      wsCatalog.getRow(3).height = 10; // Spacer row

      // Header Row (Row 4)
      const excelHeaders = [
        'Product Name *',
        'Description',
        'Category *',
        'Subcategory',
        'Selling Price (₹) *',
        'Original Price (₹)',
        'Stock Quantity *',
        'SKU',
        'Status',
        'Image URLs (Pipe Separated)',
        'Brand',
        'Tags',
        'Size',
        'Color',
        'Featured',
        'Trending'
      ];

      const headerRow = wsCatalog.getRow(4);
      headerRow.values = excelHeaders;
      headerRow.height = 28;
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB89628' } },
          left: { style: 'thin', color: { argb: 'FFB89628' } },
          bottom: { style: 'medium', color: { argb: 'FF0D0D10' } },
          right: { style: 'thin', color: { argb: 'FFB89628' } }
        };
      });

      // Sample Product Row (Row 5)
      const sampleRow = wsCatalog.getRow(5);
      sampleRow.values = SAMPLE_CSV_ROW;
      sampleRow.height = 22;
      sampleRow.font = { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } };
      sampleRow.alignment = { vertical: 'middle' };
      sampleRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDFBF7' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });

      // Set Column Widths
      const colWidths = [30, 45, 20, 18, 18, 18, 16, 16, 14, 45, 18, 24, 14, 20, 12, 12];
      wsCatalog.columns.forEach((col, idx) => {
        col.width = colWidths[idx] || 20;
      });

      // Worksheet 2: Instructions
      const wsInstructions = workbook.addWorksheet('Instructions');
      
      wsInstructions.mergeCells('A1:E1');
      const instTitle = wsInstructions.getCell('A1');
      instTitle.value = 'SRILU FashionHub — Bulk Upload Instructions';
      instTitle.font = { name: 'Playfair Display', size: 16, bold: true, color: { argb: 'FFD4AF37' } };
      instTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0D10' } };
      instTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      wsInstructions.getRow(1).height = 32;

      const instructionsList = [
        ['1. Overview & General Rules', ''],
        ['Fill out product information in the "Bulk Upload Catalog" sheet starting from row 5.'],
        ['Do not rename or remove column headers in Row 4.'],
        ['Fields marked with an asterisk (*) are mandatory.'],
        [''],
        ['2. Column Data Guidelines', ''],
        ['Product Name *', 'Mandatory. Full title of the fashion item (e.g. Royal Zardozi Sherwani).'],
        ['Category *', 'Mandatory. Must match existing categories (e.g. Women\'s Couture, Men\'s Atelier, Accessories).'],
        ['Selling Price *', 'Mandatory. Must be a positive numeric value in INR.'],
        ['Stock Quantity *', 'Mandatory. Must be a non-negative integer.'],
        ['Status', 'Accepted values: Active or Inactive. Defaults to Active.'],
        ['Image URLs', 'Pipe-separated HTTP/HTTPS image URLs. Minimum 3 images recommended.'],
        ['Example Image URL', 'https://images.unsplash.com/... | https://images.unsplash.com/...'],
        ['SKU', 'Unique alphanumeric identifier. Duplicate SKUs in database or file will fail validation.'],
        ['Size & Color', 'Comma-separated string values (e.g. S, M, L, XL / Royal Blue & Gold).'],
        ['Featured / Trending', 'Boolean indicators (True or False).']
      ];

      instructionsList.forEach((rowVals, idx) => {
        const r = wsInstructions.getRow(idx + 3);
        r.values = rowVals;
        if (rowVals[0].startsWith('1.') || rowVals[0].startsWith('2.')) {
          r.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFD4AF37' } };
        } else {
          r.font = { name: 'Arial', size: 10, color: { argb: 'FF374151' } };
        }
      });

      wsInstructions.columns = [
        { width: 26 },
        { width: 75 }
      ];

      // Generate Buffer & Trigger Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'srilu_fashionhub_bulk_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating Excel template:', err);
      alert('Failed to generate Excel template. Falling back to CSV template.');
      handleDownloadCSVTemplate();
    }
  };

  const parseCSVLine = (textLine) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < textLine.length; i++) {
      const c = textLine[i];
      if (c === '"') {
        if (inQuotes && textLine[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const processFile = async (uploadedFile) => {
    setParsing(true);
    setFile(uploadedFile);

    try {
      let rawRows = [];

      // Check if file is Excel (.xlsx, .xls) or CSV
      const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');

      if (isExcel) {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber >= 4) { // Row 4 is header, row 5 onwards are data
            const rowValues = [];
            row.eachCell({ includeEmpty: true }, (cell) => {
              const val = cell.value !== null && cell.value !== undefined ? (cell.value.result || cell.value.text || cell.value) : '';
              rowValues.push(String(val).trim());
            });
            if (rowValues.some(v => v !== '')) {
              rawRows.push(rowValues);
            }
          }
        });
      } else {
        const text = await uploadedFile.text();
        const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        rawRows = rawLines.map(line => parseCSVLine(line));
      }

      if (rawRows.length < 2) {
        alert('The uploaded file is empty or missing data rows.');
        setParsing(false);
        return;
      }

      const headers = rawRows[0].map(h => String(h).toLowerCase().trim());
      
      const findColIdx = (possibleNames) => {
        return headers.findIndex(h => possibleNames.some(name => h.includes(name.toLowerCase())));
      };

      const nameIdx = findColIdx(['product name', 'name', 'title']);
      const descIdx = findColIdx(['description', 'desc']);
      const catIdx = findColIdx(['category']);
      const subCatIdx = findColIdx(['subcategory', 'sub category']);
      const sellPriceIdx = findColIdx(['selling price', 'price', 'sell price']);
      const origPriceIdx = findColIdx(['original price', 'base price', 'mrp']);
      const stockIdx = findColIdx(['stock', 'quantity', 'inventory']);
      const skuIdx = findColIdx(['sku']);
      const statusIdx = findColIdx(['status']);
      const imgIdx = findColIdx(['image urls', 'images', 'image']);
      const brandIdx = findColIdx(['brand']);
      const tagsIdx = findColIdx(['tags']);
      const sizeIdx = findColIdx(['size']);
      const colorIdx = findColIdx(['color']);

      const existingSKUs = new Set(existingProducts.map(p => (p.sku || '').toUpperCase()).filter(Boolean));
      const seenSKUsInFile = new Set();

      const validRows = [];
      const errorRows = [];

      for (let i = 1; i < rawRows.length; i++) {
        const rowNum = i + (isExcel ? 4 : 1);
        const cols = rawRows[i];

        const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
        const description = descIdx >= 0 ? cols[descIdx] : '';
        const category = catIdx >= 0 ? cols[catIdx] : '';
        const subCategory = subCatIdx >= 0 ? cols[subCatIdx] : 'General';
        const sellingPriceStr = sellPriceIdx >= 0 ? cols[sellPriceIdx] : cols[2];
        const origPriceStr = origPriceIdx >= 0 ? cols[origPriceIdx] : '';
        const stockStr = stockIdx >= 0 ? cols[stockIdx] : '10';
        const sku = skuIdx >= 0 ? cols[skuIdx] : `SKU-${Date.now()}-${i}`;
        const status = statusIdx >= 0 ? cols[statusIdx] : 'Active';
        const imgStr = imgIdx >= 0 ? cols[imgIdx] : '';
        const brand = brandIdx >= 0 ? cols[brandIdx] : '';
        const tagsStr = tagsIdx >= 0 ? cols[tagsIdx] : '';
        const sizeStr = sizeIdx >= 0 ? cols[sizeIdx] : '';
        const colorStr = colorIdx >= 0 ? cols[colorIdx] : '';

        const rowErrors = [];

        if (!name || name.trim() === '') {
          rowErrors.push('Missing Product Name');
        }

        if (!category || category.trim() === '') {
          rowErrors.push('Missing Category');
        }

        const price = parseFloat(sellingPriceStr);
        if (isNaN(price) || price <= 0) {
          rowErrors.push('Selling Price must be a positive number');
        }

        const stock = parseInt(stockStr, 10);
        if (isNaN(stock) || stock < 0) {
          rowErrors.push('Stock must be a non-negative integer');
        }

        const upperSKU = sku ? sku.toUpperCase() : '';
        if (sku && seenSKUsInFile.has(upperSKU)) {
          rowErrors.push(`Duplicate SKU "${sku}" found within file`);
        } else if (sku && existingSKUs.has(upperSKU)) {
          rowErrors.push(`SKU "${sku}" already exists in product database`);
        }
        if (sku) seenSKUsInFile.add(upperSKU);

        let parsedImages = [];
        if (imgStr) {
          parsedImages = imgStr.split(/[|;,\s]+/).map(url => url.trim()).filter(url => url.startsWith('http'));
        }
        while (parsedImages.length < 3) {
          parsedImages.push(DEFAULT_IMAGE_SET[parsedImages.length % 3]);
        }

        if (rowErrors.length > 0) {
          errorRows.push({ rowNum, name: name || 'Unnamed Row', errors: rowErrors });
        } else {
          validRows.push({
            name,
            description: description || `${name} - Handcrafted luxury creation by SriluFashionHub.`,
            category,
            subCategory,
            price: price,
            originalPrice: origPriceStr ? parseFloat(origPriceStr) || price : price,
            stock,
            inventory: stock,
            sku,
            status: status || 'Active',
            images: parsedImages,
            image: parsedImages[0],
            brand,
            tags: tagsStr ? tagsStr.split(',').map(t => t.trim()) : [],
            sizes: sizeStr ? sizeStr.split(',').map(s => s.trim()) : [],
            color: colorStr,
            rating: 4.8
          });
        }
      }

      setPreviewData({ validRows, errorRows });
    } catch (err) {
      console.error('Error parsing catalog file:', err);
      alert('Error parsing uploaded file. Please ensure it is a valid CSV or Excel (.xlsx) file.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setImporting(true);
    const validRows = previewData.validRows;
    const total = validRows.length;

    const toastId = toast.loading(`Importing ${total} products...`, 'Bulk Import Started');
    setProgress({ current: 0, total, successCount: 0, failCount: 0 });

    const BATCH_SIZE = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(prodPayload => productAPI.create(prodPayload))
      );

      batchResults.forEach(res => {
        if (res.status === 'fulfilled' && (res.value.success || res.value._id || res.value.id || res.value.product)) {
          successCount++;
        } else {
          failCount++;
        }
      });

      const currentProcessed = Math.min(i + BATCH_SIZE, total);
      setProgress({
        current: currentProcessed,
        total,
        successCount,
        failCount
      });
    }

    setImporting(false);
    setImportDone(true);
    toast.removeToast(toastId);
    toast.success(`Successfully imported ${successCount} products into store catalog.`, 'Bulk Import Complete');
    if (onSuccess) onSuccess();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImporting(false);
    setImportDone(false);
    setProgress({ current: 0, total: 0, successCount: 0, failCount: 0 });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconBadge}>
              <Upload size={20} color="#D4AF37" />
            </div>
            <div>
              <h3 style={styles.title}>Bulk Import Products</h3>
              <p style={styles.subtitle}>Upload CSV or Excel (.xlsx) catalog spreadsheets</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.body}>
          {!previewData && !parsing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Template Download Banner */}
              <div style={styles.templateSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileSpreadsheet size={28} color="#D4AF37" />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#F9F6F0', display: 'block' }}>
                      Download Catalog Template
                    </span>
                    <span style={{ fontSize: '12px', color: '#A0A0AB' }}>
                      Pre-formatted Excel template with sample data & instructions
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    variant="primary"
                    icon={<Download size={14} />}
                    title="Download professionally branded Excel (.xlsx) template"
                  >
                    Download Template
                  </Button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                style={styles.dropZone}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <Upload size={36} color="var(--admin-gold)" style={{ marginBottom: '12px' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  Drag & Drop CSV or Excel (.xlsx) file here
                </span>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
                  Supports .csv, .xlsx, and .xls formatted spreadsheets up to 10MB
                </span>
                <label style={styles.browseBtn}>
                  Browse Local File
                  <input
                    type="file"
                    accept=".csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}

          {parsing && (
            <div style={styles.centeredState}>
              <RefreshCw size={32} color="var(--admin-gold)" className="spin-animation" style={{ marginBottom: '12px' }} />
              <span style={{ fontSize: '14px', color: 'var(--admin-text-primary)', fontWeight: '600' }}>Parsing Catalog Spreadsheet & Validating Rows...</span>
            </div>
          )}

          {/* Validation & Preview Step */}
          {previewData && !importDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={styles.previewSummary}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>
                    {previewData.validRows.length} Valid Products Ready to Import
                  </span>
                </div>
                {previewData.errorRows.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#EF4444" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#EF4444' }}>
                      {previewData.errorRows.length} Rows with Validation Errors
                    </span>
                  </div>
                )}
              </div>

              {/* Error Detail Log */}
              {previewData.errorRows.length > 0 && (
                <div style={styles.errorLogBox}>
                  <span style={styles.errorLogTitle}>Row Validation Errors (These rows will be skipped):</span>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {previewData.errorRows.map((errRow, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#F87171' }}>
                        Row {errRow.rowNum} ("{errRow.name}"): {errRow.errors.join(' • ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch Import Progress */}
              {importing && (
                <div style={styles.progressContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#F9F6F0', marginBottom: '6px' }}>
                    <span>Batch Uploading Products...</span>
                    <span>{progress.current} / {progress.total} Products</span>
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${Math.round((progress.current / (progress.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={handleReset} style={styles.cancelBtn} disabled={importing}>
                  Choose Different File
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={importing || previewData.validRows.length === 0}
                  style={{
                    ...styles.confirmBtn,
                    opacity: previewData.validRows.length === 0 ? 0.5 : 1
                  }}
                >
                  {importing ? 'Importing Batches...' : `Confirm & Import ${previewData.validRows.length} Products`}
                </button>
              </div>
            </div>
          )}

          {/* Import Complete State */}
          {importDone && (
            <div style={styles.centeredState}>
              <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F9F6F0', margin: '0 0 6px 0' }}>
                Bulk Import Completed Successfully!
              </h4>
              <p style={{ fontSize: '13px', color: '#A0A0AB', margin: '0 0 20px 0' }}>
                Successfully created {progress.successCount} luxury products in your store catalog.
                {progress.failCount > 0 ? ` (${progress.failCount} failed)` : ''}
              </p>
              <button type="button" onClick={onClose} style={styles.confirmBtn}>
                Done & View Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '680px',
    padding: '28px',
    boxShadow: 'var(--admin-shadow-lg)',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--admin-border-subtle)'
  },
  iconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.25rem',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  subtitle: {
    fontSize: '0.8rem',
    color: 'var(--admin-text-muted)',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%'
  },
  body: {
    display: 'flex',
    flexDirection: 'column'
  },
  templateSection: {
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap'
  },
  downloadCsvBtn: {
    padding: '8px 12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '8px',
    color: 'var(--admin-text-primary)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  downloadExcelBtn: {
    padding: '8px 14px',
    backgroundColor: 'var(--admin-gold)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--active-pill-text)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--admin-shadow-sm)',
    transition: 'all 0.2s ease'
  },
  dropZone: {
    border: '2px dashed var(--admin-border-gold)',
    borderRadius: '14px',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--admin-input-bg)',
    textAlign: 'center'
  },
  browseBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  centeredState: {
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  previewSummary: {
    backgroundColor: 'var(--admin-surface-2)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  errorLogBox: {
    backgroundColor: 'var(--admin-danger-bg)',
    border: '1px solid var(--admin-danger)',
    borderRadius: '10px',
    padding: '14px'
  },
  errorLogTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--admin-danger)',
    display: 'block',
    marginBottom: '8px'
  },
  progressContainer: {
    backgroundColor: 'var(--admin-surface-2)',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid var(--admin-border-subtle)'
  },
  progressBarTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--admin-border-subtle)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--admin-gold)',
    transition: 'width 0.2s ease'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '8px',
    color: 'var(--admin-text-primary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

export default BulkUploadModal;
