import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Pool } from "pg";
import { NextResponse } from "next/server";

// 1. Explicitly check if the variable exists before trying to connect
const dbUrl = process.env.SUPABASE_POOLER_URL;

if (!dbUrl) {
  console.error("CRITICAL ERROR: SUPABASE_POOLER_URL is undefined!");
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export async function POST(req) {
  try {
    if (!dbUrl) {
      throw new Error("Missing Database URL in Vercel settings.");
    }

    const { filename, dishName } = await req.json();

    if (!filename || !dishName) {
      return NextResponse.json({ error: "Missing filename or dishName" }, { status: 400 });
    }

    const uniqueTimestamp = Date.now();
    const safeFilename = filename.replace(/\s+/g, "-");
    const fileKey = `models/${uniqueTimestamp}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: "model/gltf-binary",
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    const dbRes = await pool.query(
      "INSERT INTO menu_items (dish_name, model_url) VALUES ($1, $2) RETURNING id",
      [dishName, s3Url]
    );

    return NextResponse.json({
      success: true,
      presignedUrl,
      dishId: dbRes.rows[0].id,
    });
  } catch (error) {
    console.error("SERVER UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}