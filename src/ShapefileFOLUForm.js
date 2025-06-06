import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { openDbf } from 'shapefile';
import './ShapefileForm.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const ShapefileFOLUForm = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const requiredFields = [
    'ID_RHL', 'BPDAS', 'UR_BPDAS', 'PELAKSANA', 'PROV', 'KAB', 'KEC', 'DESA',
    'NAMA_BLOK', 'LUAS_HA', 'TIPE_KNTRK', 'PEMANGKU', 'FUNGSI', 'ARAHAN',
    'POLA', 'BTG_HA', 'THN_TNM', 'JENIS_TNM', 'BTG_TOTAL', 'TGL_KNTRK',
    'NO_KNTRK', 'NILAI_KNTR'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log('File dipilih (FOLU):', selectedFile ? selectedFile.name : 'Tidak ada file');
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const validateZip = async (zipFile) => {
    try {
      console.log('Validasi ZIP (FOLU):', zipFile.name);
      const zip = new JSZip();
      const content = await zip.loadAsync(zipFile);
      const files = Object.keys(content.files);
      console.log('File di ZIP:', files);

      const shpFiles = files.filter(name => name.toLowerCase().endsWith('.shp'));
      if (shpFiles.length === 0) {
        return { valid: false, error: 'File ZIP harus berisi setidaknya satu file .shp.' };
      }

      const successMessages = [];
      const errorMessages = [];
      let shapefileIndex = 0;
      let validShapefileCount = 0;

      for (const shpFile of shpFiles) {
        shapefileIndex++;
        const baseName = shpFile.substring(0, shpFile.length - 4).toLowerCase();
        console.log('Memvalidasi shapefile:', baseName);

        const shxFile = files.find(name => name.toLowerCase() === `${baseName}.shx`);
        const dbfFile = files.find(name => name.toLowerCase() === `${baseName}.dbf`);

        if (!shxFile || !dbfFile) {
          errorMessages.push(`${shapefileIndex}. Shapefile ${baseName} belum lengkap:\n    - Harus memiliki .shp, .shx, dan .dbf`);
          continue;
        }

        const dbfContent = await content.file(dbfFile).async('arraybuffer');
        const source = await openDbf(dbfContent);
        console.log('Membuka .dbf:', dbfFile);

        let missingFields = new Set();
        let emptyFieldsMap = new Map();
        let invalidLuasHA = [];
        let featureCount = 0;

        let result;
        do {
          result = await source.read();
          console.log('Fitur:', result);
          if (result.done) break;

          featureCount++;
          const feature = result.value;
          if (!feature) {
            errorMessages.push(`${shapefileIndex}. Shapefile ${baseName} tidak valid:\n    - Baris ke-${featureCount} tidak valid`);
            break;
          }

          const properties = feature.properties || feature;
          if (!properties || typeof properties !== 'object') {
            errorMessages.push(`${shapefileIndex}. Shapefile ${baseName} tidak valid:\n    - Baris ke-${featureCount} tidak memiliki properti valid`);
            break;
          }
          console.log('Properti fitur:', properties);

          for (const field of requiredFields) {
            if (!(field in properties)) {
              missingFields.add(field);
            } else {
              const value = properties[field];
              if (value === null || value === '') {
                if (!emptyFieldsMap.has(field)) {
                  emptyFieldsMap.set(field, []);
                }
                emptyFieldsMap.get(field).push(featureCount);
              }
            }
          }

          if ('LUAS_HA' in properties) {
            const value = properties.LUAS_HA;
            if (value !== null && value !== '') {
              const numericValue = parseFloat(value);
              if (isNaN(numericValue)) {
                invalidLuasHA.push(`Baris ke-${featureCount}: LUAS_HA harus numerik`);
              } else {
                const decimalPart = numericValue % 1;
                if (decimalPart > 0.5) {
                  invalidLuasHA.push(`Baris ke-${featureCount}: LUAS_HA desimal lebih dari 0.5`);
                }
              }
            }
          }
        } while (!result.done);

        if (featureCount === 0) {
          errorMessages.push(`${shapefileIndex}. Shapefile ${baseName} tidak valid:\n    - Tidak memiliki data`);
          continue;
        }

        let shapefileErrors = [];
        if (missingFields.size > 0 || emptyFieldsMap.size > 0 || invalidLuasHA.length > 0) {
          shapefileErrors.push(`${shapefileIndex}. Shapefile ${baseName} belum lengkap:`);
          if (missingFields.size > 0) {
            shapefileErrors.push(`    a. Field yang belum ada:`);
            Array.from(missingFields).forEach(field => {
              shapefileErrors.push(`         - ${field}`);
            });
          }
          if (emptyFieldsMap.size > 0) {
            shapefileErrors.push(`    b. Field yang kosong:`);
            emptyFieldsMap.forEach((rows, field) => {
              shapefileErrors.push(`         - ${field}, pada baris: ${rows.join(', ')}`);
            });
          }
          if (invalidLuasHA.length > 0) {
            shapefileErrors.push(`    c. Kesalahan pada LUAS_HA:`);
            invalidLuasHA.forEach(error => {
              shapefileErrors.push(`         - ${error}`);
            });
          }
          errorMessages.push(shapefileErrors.join('\n'));
        } else {
          successMessages.push(`${shapefileIndex}. Shapefile ${baseName} sudah lengkap`);
          validShapefileCount++;
        }
      }

      if (validShapefileCount === shpFiles.length) {
        return { valid: true, success: 'Data sudah valid dan selesai diunggah' };
      } else {
        let combinedMessage = [];
        if (successMessages.length > 0) {
          combinedMessage.push(successMessages.join('\n'));
        }
        if (errorMessages.length > 0) {
          combinedMessage.push(errorMessages.join('\n'));
        }
        combinedMessage.push('Harap perbaiki shapefile dan upload ulang');
        return { valid: false, error: combinedMessage.join('\n') };
      }
    } catch (err) {
      console.error('Error validasi ZIP (FOLU):', err);
      return { valid: false, error: `Gagal memvalidasi ZIP: ${err.message}\nHarap perbaiki shapefile dan upload ulang` };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUploading(true);

    if (!file) {
      console.log('Tidak ada file dipilih');
      setError('Silakan pilih file ZIP terlebih dahulu!');
      setIsUploading(false);
      return;
    }

    console.log('Memulai validasi file:', file.name);
    const validation = await validateZip(file);
    if (!validation.valid) {
      console.error('Validasi gagal:', validation.error);
      setError(validation.error);
      setIsUploading(false);
      return;
    }

    let filePath = '';
    try {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      console.log('Waktu lokal:', now.toString());
      const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '_').toUpperCase();
      const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/[:.]/g, '');
      const fileNameWithDate = `${dateString}_${timeString}_${file.name}`;
      filePath = `shapefiles/${fileNameWithDate}`;
      console.log('Mengunggah ke:', { bucket: 'rhlfolu', filePath });

      const { data: uploadData, error: fileError } = await supabase.storage
        .from('rhlfolu')
        .upload(filePath, file, { upsert: true });

      if (fileError) {
        console.error('Upload error:', fileError);
        setError('Gagal mengunggah: ' + fileError.message);
        setIsUploading(false);
        return;
      }
      console.log('Upload sukses:', uploadData);

      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      console.log('Mengirim ke backend:', { zip_path: filePath, bucket: 'rhlfolu' });
      const response = await fetch(`${BACKEND_URL}/validate-shapefile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_path: filePath, bucket: 'rhlfolu' })
      });

      const result = await response.json();
      console.log('Respons backend:', result);

      if (!response.ok) {
        console.error('Backend error:', result);
        setError(result.error || 'Gagal memproses shapefile.');
        await supabase.storage.from('rhlfolu').remove([filePath]);
        setIsUploading(false);
        return;
      }

      setSuccess(validation.success);
      setFile(null);
      document.getElementById('shapefileFOLUInput').value = '';
    } catch (err) {
      console.error('Error umum:', err);
      setError('Terjadi kesalahan: ' + err.message);
      if (filePath) {
        await supabase.storage.from('rhlfolu').remove([filePath]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Upload Shapefile RHL FOLU</h2>
      {error && <pre className="error">{error}</pre>}
      {success && <p className="success">{success}</p>}
      {isUploading && <p className="uploading">Sedang mengunggah shapefile...</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="shapefileFOLUInput" className="file-input-label">
            Pilih File .zip FOLU
          </label>
          <input
            type="file"
            id="shapefileFOLUInput"
            name="shapefile"
            onChange={handleFileChange}
            accept=".zip"
            required
            disabled={isUploading}
            className="file-input"
          />
          <div className="file-name-box">
            {file ? file.name : 'Tidak ada file dipilih'}
          </div>
          <button type="submit" disabled={isUploading} className="upload-button">
            {isUploading ? 'Mengunggah...' : 'Unggah'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShapefileFOLUForm;