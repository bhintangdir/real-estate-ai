import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/gemini";

export async function GET() {
  try {
    const testText = "Hello AI Brain";
    const embedding = await generateEmbedding(testText);
    
    if (embedding) {
      return NextResponse.json({ 
        success: true, 
        message: "Gemini API Connection established!",
        dimensions: embedding.length 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Gemini API failed. Check server console for Gemini API Error." 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
