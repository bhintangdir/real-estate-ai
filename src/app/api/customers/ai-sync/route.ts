import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding, analyzeLeadIntelligence } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // 1. Fetch current customer data using ADMIN client to bypass RLS
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (fetchError || !customer) {
      throw new Error("Customer not found");
    }

    // 2. Generate Semantic String for Embedding
    // We combine key info into a searchable block
    const semanticContent = `
      Customer: ${customer.full_name}. 
      Status: ${customer.lead_status}. 
      Priority: ${customer.priority}. 
      Budget Range: ${customer.target_budget_min || 0} to ${customer.target_budget_max || 0}.
      Interest & Notes: ${customer.notes || "No specific notes"}.
    `.trim();

    // 3. Run AI Processes in Parallel
    const [embedding, intelligence] = await Promise.all([
      generateEmbedding(semanticContent),
      analyzeLeadIntelligence(customer)
    ]);

    if (!embedding) {
      return NextResponse.json({ error: "AI Failed: Could not generate vector map. Check Gemini API Key or Quota." }, { status: 500 });
    }

    if (!intelligence) {
      return NextResponse.json({ error: "AI Failed: Could not analyze lead profile. Gemini Model might be overloaded." }, { status: 500 });
    }

    // 4. Update Database using admin client
    const { error: updateError } = await supabaseAdmin
      .from("customers")
      .update({
        embedding: embedding,
        lead_score: intelligence.score,
        ai_score_reasoning: intelligence.reasoning,
        updated_at: new Date().toISOString()
      })
      .eq("id", customerId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      score: intelligence?.score,
      reasoning: intelligence?.reasoning 
    });

  } catch (error: any) {
    console.error("AI Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
