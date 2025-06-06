import React from 'react';
import ShapefileRHLVegetatifForm from './ShapefileRHLVegetatifForm';
import ShapefileUPSAForm from './ShapefileUPSAForm';
import ShapefileFOLUForm from './ShapefileFOLUForm';
import Keterangan from './Keterangan';
import './App.css';
import './ShapefileForm.css'; // Import CSS untuk subheader

function App() {
  return (
    <div className="App">
      <div className="form-container">
        <h1>FORM UPLOAD SHAPEFILE DIREKTORAT REHABILITASI HUTAN</h1>
        <p className="subheader">(Silakan baca keterangan terlebih dahulu di bagian paling bawah)</p>
      </div>
      <ShapefileRHLVegetatifForm />
      <ShapefileUPSAForm />
      <ShapefileFOLUForm />
      <Keterangan />
    </div>
  );
}

export default App;