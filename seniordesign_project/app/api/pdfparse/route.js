import axios from "axios";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false, 
  },
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req) {
  try {
    console.log("--- /api/pdfparse API route hit ---"); // <--- ADD THIS LOG
    const fileBuffer = await buffer(req);
    
    const tempFilePath = "./temp_uploaded.pdf";
    await fs.writeFile(tempFilePath, fileBuffer);

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), "uploaded.pdf");

    const response = await axios.post("http://localhost:8001/extract-text/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fs.unlink(tempFilePath);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 500 });
  }
}