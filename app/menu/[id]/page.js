import Script from "next/script";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SUPABASE_POOLER_URL,
  ssl: { rejectUnauthorized: false },
});

// Update the type signature if using TypeScript, or simply await params in JS
export default async function DishViewer({ params }) {
  // Await the params Promise (Required for Next.js 15+)
  const { id } = await params;
  
  // Fetch the dish from your database
  const dbRes = await pool.query("SELECT * FROM menu_items WHERE id = $1", [id]);
  
  if (dbRes.rowCount === 0) {
    return <h1 style={{ textAlign: "center", marginTop: "50px" }}>Dish not found</h1>;
  }
  
  const dish = dbRes.rows[0];

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#f9f9f9" }}>
      <h2 style={{ textAlign: "center", padding: "20px 0" }}>{dish.dish_name}</h2>
      
      {/* Load Google's 3D/AR engine */}
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></Script>
      
      <model-viewer
        src={dish.model_url}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={{ width: "100%", height: "70vh" }}
      >
        {/* The button that pops up asking to use the phone camera */}
        <button slot="ar-button" style={{ backgroundColor: "#0070f3", color: "white", borderRadius: "8px", border: "none", position: "absolute", bottom: "16px", right: "16px", padding: "12px 24px", fontWeight: "bold" }}>
          📷 View on your table
        </button>
      </model-viewer>
    </div>
  );
}