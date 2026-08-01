import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { NextResponse } from "next/server";

const s3 = new S3Client({ 
  region: process.env.AWS_REGION 
});

// CHANGE 1: Added SSL configuration for Supabase
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const file = formData.get("file");
    const dishName = formData.get("dishName");

    if (!file || !dishName) {
      return NextResponse.json({ error: "Missing file or name" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueTimestamp = Date.now();
    const safeDishName = file.name.replace(/\s+/g, '-');
    const fileKey = `models/${uniqueTimestamp}-${safeDishName}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: "model/gltf-binary" 
    }));

    // CHANGE 2: Added the AWS region directly into the public URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    const dbRes = await pool.query(
      "INSERT INTO menu_items (dish_name, model_url) VALUES ($1, $2) RETURNING id",
      [dishName, s3Url]
    );

    return NextResponse.json({ success: true, dishId: dbRes.rows[0].id });
  } catch (error) {
    console.error("API Error during upload:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}