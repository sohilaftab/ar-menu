const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Ask the Next.js backend for an S3 upload ticket
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, dishName }),
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 2. Upload the heavy file DIRECTLY to AWS S3 using the ticket (bypassing Vercel's limit)
      const uploadRes = await fetch(data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "model/gltf-binary" },
      });

      if (uploadRes.ok) {
        // 3. Generate the QR code if the S3 upload succeeded
        setQrLink(`${window.location.origin}/menu/${data.dishId}`);
      } else {
        alert("Failed to upload to S3 directly.");
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