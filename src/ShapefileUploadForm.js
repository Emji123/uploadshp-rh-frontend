// src/ShapefileUploadForm.js
import React, { useState } from 'react';
import './ShapefileForm.css';

const ShapefileUploadForm = () => {
  const [bpdas, setBpdas] = useState('');
  const [year, setYear] = useState('');
  const [activity, setActivity] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const bpdasOptions = [
    'krueng_aceh', 'wampu_sei_ular', 'asahan_barumun', 'agam_kuantan',
    'indragiri_rokan', 'batanghari', 'ketahun', 'musi', 'baturusa_cerucuk',
    'sei_jang_duriangkang', 'way_seputih_sekampung', 'citarum_ciliwung',
    'cimanuk_citanduy', 'pemali_jratun', 'solo', 'serayu_opak_progo',
    'brantas_sampean', 'kapuas', 'kahayan', 'barito', 'mahakam_berau',
    'tondano', 'bone_limboto', 'palu_poso', 'karama', 'jeneberang_saddang',
    'konaweha', 'unda_anyar', 'dodokan_moyosari', 'benain_noelmina',
    'waehapu_batu_merah', 'ake_malamo', 'remu_ransiki', 'memberamo'
  ];

  const years = Array.from({ length: 2026 - 2019 + 1 }, (_, i) => 2019 + i);
  const activities = ['RHL Vegetatif', 'RHL UPSA', 'RHL FOLU'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUploading(true);

    if (!file) {
      setError('Silakan pilih file ZIP terlebih dahulu!');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bpdas', bpdas);
      formData.append('year', year);
      formData.append('activity', activity);

      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/validate-shapefile`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Gagal memproses shapefile.');
        return;
      }

      setSuccess(result.message || 'Validasi berhasil');
      setFile(null);
      document.getElementById('shapefileInput').value = '';
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Upload Shapefile</h2>

      <div className="dropdown-group">
        <div className="dropdown-item">
          <label>BPDAS</label>
          <select value={bpdas} onChange={(e) => setBpdas(e.target.value)} required>
            <option value="">Pilih BPDAS</option>
            {bpdasOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-item">
          <label>Tahun</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} required>
            <option value="">Pilih Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="dropdown-item">
          <label>Kegiatan</label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} required>
            <option value="">Pilih Kegiatan</option>
            {activities.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {bpdas && year && activity && (
        <form onSubmit={handleSubmit} className="upload-form">
          {error && <pre className="error">{error}</pre>}
          {success && <p className="success">{success}</p>}
          {isUploading && <p className="uploading">Sedang mengunggah shapefile...</p>}

          <label className="file-input-label">
            Pilih File ZIP
            <input
              type="file"
              id="shapefileInput"
              accept=".zip"
              onChange={handleFileChange}
              disabled={isUploading}
              required
            />
          </label>

          <div className="file-name-box">
            {file ? file.name : 'Tidak ada file dipilih'}
          </div>

          <button type="submit" disabled={isUploading}>
            {isUploading ? 'Mengunggah...' : 'Unggah'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ShapefileUploadForm;
