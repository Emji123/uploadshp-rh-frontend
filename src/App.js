import React from 'react';
import ShapefileRHLVegetatifForm from './ShapefileRHLVegetatifForm';
import ShapefileUPSAForm from './ShapefileUPSAForm';
import ShapefileFOLUForm from './ShapefileFOLUForm';
import Keterangan from './Keterangan';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>FORM UPLOAD SHAPEFILE DIREKTORAT REHABILITASI HUTAN</h1>
      <ShapefileRHLVegetatifForm />
      <ShapefileUPSAForm />
      <ShapefileFOLUForm />
      <Keterangan />
    </div>
  );
}

export default App;