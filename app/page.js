"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
  const [dishName, setDishName] = useState("");
  const [file, setFile] = useState(null);
  const [qrLink, setQrLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Package the file and name into FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dishName", dishName);

    // Send to our backend API
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    const data = await res.json();
    if (data.success) {
      // Create the final URL the QR code will point to
      setQrLink(`${window.location.origin}/menu/${data.dishId}`);
    } else {
      alert("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-10 font-sans">
      <h1 className="text-3xl font-bold mb-8">Upload 3D Menu Item</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input 
          type="text" 
          placeholder="Enter Dish Name" 
          className="border p-2 rounded text-black"
          onChange={e => setDishName(e.target.value)} 
          required 
        />
        <input 
          type="file" 
          accept=".glb" 
          className="border p-2 rounded"
          onChange={e => setFile(e.target.files[0])} 
          required 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading to S3..." : "Upload & Generate QR"}
        </button>
      </form>

      {qrLink && (
        <div className="mt-12 flex flex-col items-center bg-white p-6 rounded shadow-lg text-black">
          <h3 className="text-xl mb-4 font-bold">Print this QR Code:</h3>
          <QRCodeSVG value={qrLink} size={250} />
          <p className="mt-4 text-blue-600 underline">
            <a href={qrLink} target="_blank" rel="noreferrer">Open Customer View</a>
          </p>
        </div>
      )}
    </div>
  );
}