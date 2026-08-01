'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [dishName, setDishName] = useState('');
  const [qrLink, setQrLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !dishName) {
      alert("Please select a file and enter a dish name.");
      return;
    }
    setLoading(true);

    try {
      // 1. Get pre-signed URL from Next.js API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, dishName }),
      });

      const data = await res.json();

      if (data.success) {
        // 2. Upload heavy file DIRECTLY to S3 (bypassing Vercel's limit)
        const uploadRes = await fetch(data.presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "model/gltf-binary" },
        });

        if (uploadRes.ok) {
          // 3. Set the AR link for QR generation
          setQrLink(`${window.location.origin}/menu/${data.dishId}`);
        } else {
          alert("Failed to upload model file directly to S3.");
        }
      } else {
        alert("Failed to get upload ticket from server.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">AR Menu Generator</h1>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Dish Name</label>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="e.g. Margherita Pizza"
            className="w-full border p-2 rounded text-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">3D Model (.glb file)</label>
          <input
            type="file"
            accept=".glb"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border p-2 rounded text-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Generate AR QR Code"}
        </button>
      </form>

      {qrLink && (
        <div className="mt-8 text-center p-4 bg-green-50 border border-green-200 rounded-lg w-full">
          <h2 className="text-xl font-semibold text-green-800 mb-2">QR Code Link Ready!</h2>
          <p className="text-sm text-gray-600 mb-2">Access your 3D AR Model here:</p>
          <a
            href={qrLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-medium break-all"
          >
            {qrLink}
          </a>
        </div>
      )}
    </main>
  );
}