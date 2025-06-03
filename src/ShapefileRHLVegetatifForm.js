import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { openDbf } from 'shapefile';
import './ShapefileForm.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const ShapefileRHLVegetatifForm = () => {
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
    console.log('File dipilih (RHL Vegetatif):', selectedFile ? selectedFile.name : 'Tidak ada file');
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const validateZip = async (zipFile) => {
    try {
      console.log('Validasi ZIP (RHL Vegetatif):', zipFile.name);
      const zip = new JSZip();
      const content = await zip.loadAsync(zipFile);
      const files = Object.keys(content.files);
      console.log('File di ZIP:', files);

      const shpFiles = files.filter(name => name.toLowerCase().endsWith('.shp'));
      if (shpFiles.length === 0) {
        return { valid: false, error: 'File ZIP harus berisi setidaknya satu file .shp.' };
      }

      const errorMessages = [];

      for (const shpFile of shpFiles) {
        const baseName = shpFile.substring(0, shpFile.length - 4).toLowerCase();
        console.log('Memvalidasi shapefile:', baseName);

        const shxFile = files.find(name => name.toLowerCase() === `${baseName}.shx`);
        const dbfFile = files.find(name => name.toLowerCase() === `${baseName}.dbf`);
        const prjFile = files.find(name => name.toLowerCase() === `${baseName}.prj`);

        if (!shxFile || !dbfFile) {
          errorMessages.push(`- Shapefile ${baseName} tidak lengkap: harus memiliki .shp, .shx, dan .dbf.`);
          continue;
        }

        if (!prjFile) {
          errorMessages.push(`- Shapefile ${baseName} tidak memiliki file .prj.`);
          continue;
        }

        // Cek proyeksi WGS84
        const prjContent = await content.file(prjFile).async('string');
        const wgs84Pattern = /GEOGCS\["GCS_WGS_1984"/i;
        if (!wgs84Pattern.test(prjContent)) {
          errorMessages.push(`- Shapefile ${baseName} tidak menggunakan proyeksi WGS84.`);
          continue;
        }

        const dbfContent = await content.file(dbfFile).async('arraybuffer');
        const source = await openDbf(dbfContent);
        console.log('Membuka .dbf:', dbfFile);

        let missingFields = new Set();
        let emptyFields = [];
        let featureCount = 0;

        let result;
        do {
          result = await source.read();
          console.log('Fitur:', result);
          if (result.done) break;

          featureCount++;
          const feature = result.value;
          if (!feature) {
            errorMessages.push(`- Baris ke-${featureCount} dalam ${dbfFile} tidak valid.`);
            break;
          }

          const properties = feature.properties || feature;
          if (!properties || typeof properties !== 'object') {
            errorMessages.push(`- Baris ke-${featureCount} dalam ${dbfFile} tidak memiliki properti valid.`);
            break;
          }
          console.log('Properti fitur:', properties);

          requiredFields.forEach(field => {
            if (!(field in properties)) {
              missingFields.add(field);
            }
          });

          let emptyInFeature = [];
          requiredFields.forEach(field => {
            if (field in properties) {
              const value = properties[field];
              if (value === null || value === '') {
                emptyInFeature.push(field);
              }
            }
          });
          if (emptyInFeature.length > 0) {
            emptyFields.push(`Baris ke-${featureCount} pada field: ${emptyInFeature.join(', ')}`);
          }
        } while (!result.done);

        if (featureCount === 0) {
          errorMessages.push(`- File ${dbfFile} tidak ada data.`);
          continue;
        }

        if (missingFields.size > 0) {
          errorMessages.push(`- Field belum ditambahkan dalam ${dbfFile}: ${Array.from(missingFields).join(', ')}.`);
        }
        if (emptyFields.length > 0) {
          errorMessages.push(`- Field belum di-upload dalam daftar data di ${dbfFile}: ${emptyFields.join('; ')}`);
        }
      }

      if (errorMessages.length > 0) {
        return { valid: false, error: errorMessages.join('\n') };
      }

      return { valid: true };
    } catch (err) {
      console.error('Error validasi ZIP (RHL Vegetatif):', err);
      return { valid: false, error: `Gagal memvalidasi ZIP: ${err.message}` };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUploading(true);

    if (!file) {
      setError('Pilih file ZIP terlebih dahulu!');
      setIsUploading(false);
      return;
    }

    const validation = await validateZip(file);
    if (!validation.valid) {
      setError(validation.error);
      setIsUploading(false);
      return;
    }

    let filePath = '';
    try {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '.').toUpperCase();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/:/g, '');
      const fileNameWithDate = `${dateString}_${timeString}_${file.name}`;
      filePath = `shapefiles/${fileNameWithDate}`;

      const { data: uploadData, error: fileError } = await supabase.storage
        .from('rhlvegetatif')
        .upload(filePath, file, { upsert: true });

      if (fileError) {
        console.error('Upload error (RHL Vegetatif):', fileError);
        setError('Gagal mengunggah: ' + fileError.message);
        setIsUploading(false);
        return;
      }

      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/validate-shapefile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_path: filePath, bucket: 'rhlvegetatif' })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Gagal memvalidasi shapefile.');
        await supabase.storage.from('rhlvegetatif').remove([filePath]);
        setIsUploading(false);
        return;
      }

      setSuccess('Shapefile berhasil diunggah dan divalidasi!');
      setFile(null);
      document.getElementById('shapefileInput').value = '';
    } catch (err) {
      console.error('Error umum (RHL Vegetatif):', err);
      setError('Terjadi kesalahan: ' + err.message);
      if (filePath) {
        await supabase.storage.from('rhlvegetatif').remove([filePath]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Upload Shapefile RHL Reguler</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {isUploading && <p className="uploading">Sedang mengunggah...</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="shapefileInput" className="file-input-label">
            Pilih File .zip
          </label>
          <input
            type="file"
            id="shapefileInput"
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
          <button type="submit" disabled={isUploading} className="btn-blue">
            Unggah
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShapefileRHLVegetatifForm;