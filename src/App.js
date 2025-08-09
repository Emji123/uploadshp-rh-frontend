import React from 'react';
import ShapefileUploadForm from './ShapefileUploadForm';
import Keterangan from './Keterangan';
import './App.css';
import './ShapefileForm.css';

function App() {
  return (
    <div className="App">
      <div className="form-container">
        <h1>FORM UPLOAD SHAPEFILE DIREKTORAT REHABILITASI HUTAN</h1>
        <p className="subheader">(Silakan baca keterangan terlebih dahulu di bagian paling bawah)</p>
      </div>
      <ShapefileUploadForm />
      <Keterangan />
    </div>
  );
}

export default App;