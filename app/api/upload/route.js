import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Pool } from "pg";
import { NextResponse } from "next/server";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req) {
  try {
    // We only expect JSON now (the file name and dish name), NOT the actual heavy file
    const { filename, dishName } = await req.json();

    if (!filename || !dishName) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const uniqueTimestamp = Date.now();
    const safeDishName = filename.replace(/\s+/g, '-');
    const fileKey = `models/${uniqueTimestamp}-${safeDishName}`;
    
    // Create the command that the browser will eventually execute
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: "model/gltf-binary"
    });

    // Generate a secure ticket (URL) valid for 60 seconds
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Save to database immediately
    const dbRes = await pool.query(
      "INSERT INTO menu_items (dish_name, model_url) VALUES ($1, $2) RETURNING id",
      [dishName, s3Url]
    );

    // Send the upload ticket and new ID back to the frontend
    return NextResponse.json({ 
      success: true, 
      presignedUrl, 
      dishId: dbRes.rows[0].id 
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}