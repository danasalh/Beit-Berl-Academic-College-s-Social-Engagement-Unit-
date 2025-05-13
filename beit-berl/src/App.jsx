
import React from 'react'
import ExportButton from './components/Buttons/ExportButton/ExportButton'


import './App.css'

function App() {
  const content = 'Nom,Âge\nAlice,30\nBob,25'
  const filename = 'utilisateurs.csv'

  return (
    <div className="app-container">
      <h1>Exporter les données</h1>
      <ExportButton filename={filename} content={content} />
    </div>
  )
}

export default App
