import React from 'react'
import './ExportButton.css'
import { FiDownload } from 'react-icons/fi' // Flèche vers le bas (download)

const ExportButton = ({ filename, content }) => {
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="export-icon-button" onClick={handleExport} title="Télécharger">
      <FiDownload />
    </button>
  )
}

export default ExportButton
