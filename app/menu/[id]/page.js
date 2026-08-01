import { Pool } from "pg";
import Script from "next/script";

export default async function CustomerARView({ params }) {
  // 1. AWAIT THE PARAMS (Required for the latest Next.js versions)
  const resolvedParams = await params;
  const dishId = resolvedParams.id;

  // 2. Configure the database with SSL to support Supabase
  const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
  });
  
  // 3. Fetch the dish using the resolved ID
  const dbRes = await pool.query(
      "SELECT * FROM menu_items WHERE id = $1", 
      [dishId]
  );
  const dish = dbRes.rows[0];

  if (!dish) return <h1 className="text-center mt-20 text-2xl">Dish not found</h1>;

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-100">
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" 
      />
      
      <div className="p-4 bg-white shadow-md z-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800">{dish.dish_name}</h1>
      </div>
      
      <div className="flex-grow relative">
        <model-viewer
          src={dish.model_url}
          alt={dish.dish_name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: "100%", height: "100%", backgroundColor: "#f3f4f6" }}
        >
          <button 
            slot="ar-button" 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg text-lg"
          >
            📷 View on your table
          </button>
        </model-viewer>
      </div>
    </div>
  );
}