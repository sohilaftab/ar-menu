'use client';

import { useState } from 'react';

export default function Home() {
  // Form input states
  const [dishName, setDishName] = useState('');
  const [file, setFile] = useState(null);
  
  // Status states
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // QR Card states (preserves name & ID for display after input reset)
  const [uploadedDishId, setUploadedDishId] = useState(null);
  const [uploadedDishName, setUploadedDishName] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !dishName) return alert('Please enter dish name and select a .glb file');

    setIsUploading(true);
    setErrorMessage('');
    setUploadedDishId(null);

    try {
      // 1. Get S3 Presigned URL & DB Dish ID from Next.js backend
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dishName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error creating upload request');

      // 2. Upload GLB file directly to AWS S3
      const s3Res = await fetch(data.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: file,
      });

      if (!s3Res.ok) throw new Error('Failed to upload 3D model to AWS S3');

      // 3. Save dish details for QR Display AND reset the form inputs
      setUploadedDishId(data.dishId);
      setUploadedDishName(dishName); // Saves dish name for the QR card display
      setDishName('');               // Clears input box for next entry
      setFile(null);                 // Resets file input

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const targetUrl = typeof window !== 'undefined' && uploadedDishId 
    ? `${window.location.origin}/menu/${uploadedDishId}` 
    : '';

  return (
    <main style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Add New 3D Menu Item</h2>

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Dish Name:</label>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="e.g. Cheese Burger"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>3D Model (.glb file):</label>
          <input
            type="file"
            accept=".glb"
            onChange={(e) => setFile(e.target.files[0])}
            required
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          style={{
            padding: '12px',
            backgroundColor: isUploading ? '#888' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Uploading & Creating QR...' : 'Upload & Generate QR'}
        </button>
      </form>

      {errorMessage && (
        <p style={{ color: 'red', marginTop: '16px', padding: '10px', backgroundColor: '#ffebeb', borderRadius: '6px' }}>
          {errorMessage}
        </p>
      )}

      {uploadedDishId && (
        <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', border: '1px solid #eaeaea', borderRadius: '12px' }}>
          <h3 style={{ color: '#0070f3', marginBottom: '8px' }}>🎉 Upload Complete!</h3>
          <p style={{ color: '#555', fontSize: '14px', marginBottom: '16px' }}>
            Scan with your mobile camera to see <strong>{uploadedDishName}</strong> in AR:
          </p>

          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`}
            alt="AR Menu QR Code"
            width="250"
            height="250"
            style={{ borderRadius: '12px', border: '6px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          />

          <div style={{ marginTop: '16px' }}>
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', fontSize: '14px' }}>
              Open AR View directly on this device →
            </a>
          </div>
        </div>
      )}
    </main>
  );
}