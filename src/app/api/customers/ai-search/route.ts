import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Convert Natural Language Query to Vector
    console.log("Generating embedding for query:", query);
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      console.error("AI Search Error: Model failed to generate embedding vector.");
      return NextResponse.json({ error: "Could not understand search query. Check Gemini API Key." }, { status: 500 });
    }

    console.log("Query vectorized. Dimensions:", queryEmbedding.length);

    // 2. Query Supabase using SQL Function (RPC) as Admin to bypass RLS
    const { data: results, error: searchError } = await supabaseAdmin.rpc("match_customers", {
      query_embedding: queryEmbedding,
      match_threshold: -1.0, // Using -1.0 to force any result for debugging
      match_count: 10
    });

    if (searchError) {
      console.error("Supabase RPC Error:", searchError);
      return NextResponse.json({ error: `Database Search Error: ${searchError.message}` }, { status: 500 });
    }

    console.log("AI Search Results for:", query, "Found:", results?.length || 0);

    return NextResponse.json({ success: true, results: results || [] });

  } catch (error: any) {
    console.error("AI Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
