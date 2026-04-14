import { NextResponse } from "next/server";
import { generatePropertyMarketing } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Configuration Error: GOOGLE_GEMINI_API_KEY is not defined in your server environment (.env file)." 
      }, { status: 500 });
    }

    const propertyData = await request.json();
    const result = await generatePropertyMarketing(propertyData);
    
    if (!result) {
      return NextResponse.json({ error: "Gemini Model Error: The AI returned an empty response. Check your API quota or model name." }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DEBUG - AI Route Error:", error);
    return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
  }
}
