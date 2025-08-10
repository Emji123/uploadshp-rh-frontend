import React from 'react';
import './Keterangan.css';

const Keterangan = () => {
  return (
    <div className="keterangan-container">
      <h3>Keterangan:</h3>
      <ol>
        <li>
          Format Atrribute shapefile mengacu Permen LHK 23 thn 2021, secara rinci dapat merujuk pada <a href="https://docs.google.com/document/d/1BD2eFZ7E5Iv-fl0eNWYQmROEehbigg5SASzSLumqzrM/edit?tab=t.0" target="_blank" rel="noopener noreferrer">link berikut</a>. Ketidaksesuaian nama field dan/atau tidak tersedianya salah satu field dapat menyebabkan eror saat proses upload.
        </li>
        <li>Nama Field diketik menggunakan huruf Kapital dan semua field harus terisi datanya, jika memang tidak ada datanya silakan isi dengan "NO DATA".</li>
        <li>Field LUAS_HA di isi dengan luasan yang sama dengan luasan rantek (maksimal lebih dari 0,5 Ha). Gunakan Proyeksi Cylindrical Equal Area (world) untuk menghitung luas polygon.</li>
        <li>
          Shapefile dikemas dalam file berekstensi .zip, harap pilih nama BPDAS, tahun kegiatan dan Jenis Kegiatan terlebih dahulu. Format penamaan file .zip dapat mengikuti format "BPDAS_JENISKEGIATAN.zip", contohnya sebagai berikut:
          <ul>
            <li>"WAMPU_SEI_ULAR_RHLREGULER.zip" untuk kegiatan penanaman RHL intensif dan/atau agroforestry</li>
            <li>"WAMPU_SEI_ULAR_UPSA.zip" untuk kegiatan pembuatan dan penanaman UPSA</li>
            <li>"WAMPU_SEI_ULAR_RHLFOLU.zip" untuk kegiatan pembuatan dan penanaman RHL FOLU</li>
          </ul>
          Penulisan nama file .shp mengikuti format "BPDAS_JENISKEGIATAN1.shp", contohnya "WAMPU_SEI_ULAR_RHLREGULER.shp".
        </li>
        <li>Hindari menempatkan file-file tersebut dalam folder maupun subfolder karena akan menyebabkan eror dalam proses upload.</li>
        <li>Shapefile wajib dibuat menggunakan proyeksi geografis datum WGS1984.</li>
        <li>Infokan ke PIC terkait jika selesai mengupload data. Jika ada kendala terkait proses upload, silakan berkoordinasi dengan PIC terkait.</li>
      </ol>
    </div>
  );
};

export default Keterangan;