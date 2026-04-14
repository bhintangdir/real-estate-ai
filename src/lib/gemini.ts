import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
const rawModelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
// Ensure we don't use non-existent models from .env typos
const modelName = rawModelName.includes("2.5") ? "gemini-2.0-flash" : rawModelName;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

export const generatePropertyMarketing = async (propertyData: any) => {
  try {
    const prompt = `
      You are a professional real estate marketing expert in Lombok/Bali. 
      Generate a compelling SEO Title and Social Media Caption for the following property:
      
      Title: ${propertyData.title}
      Type: ${propertyData.listing_type}
      Category: ${propertyData.category_name}
      Price: ${propertyData.currency} ${propertyData.price}
      Location: ${propertyData.city}, ${propertyData.location}
      Specifications: ${JSON.stringify(propertyData.specifications)}
      Amenities: ${propertyData.amenities?.join(", ")}
      Description: ${propertyData.description}

      Return the response in STRICT JSON format with these keys:
      "seo_title": (A punchy, SEO-optimized title within 60 characters)
      "social_caption": (An engaging social media caption with 3-5 relevant hashtags)
      "description": (A professional, compelling property description of 2-3 paragraphs. If the input description was provided, improve it. If not, generate a new one based on specs.)
      
      Output only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Find JSON block using better regex to more robustly handle AI output
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", text);
      return null;
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw content:", jsonMatch[0]);
      return null;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

/**
 * PHASE 4: AI BRAIN INTEGRATION
 * Generate vector embeddings for semantic search
 */
export async function generateEmbedding(text: string) {
  try {
    if (!apiKey) {
      console.error("Gemini Error: GOOGLE_GEMINI_API_KEY is missing in .env");
      return null;
    }

    // Using the official SDK method for embeddings
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    console.log("AI Agent: Generating embedding for text snippet...");
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values) {
      console.error("Gemini Error: No embedding values returned.");
      return null;
    }
    
    return embedding.values;
  } catch (error: any) {
    console.error("Gemini Critical Error (Embedding):", error.message || error);
    return null;
  }
}

/**
 * AI Lead Scoring
 * Analyzes customer potential based on profile and requirements
 */
export const analyzeLeadIntelligence = async (customer: any) => {
  try {
    const prompt = `
      You are an elite AI Real Estate Analyst for high-end properties in Bali/Lombok.
      Analyze the following customer lead and provide a potential score (1-100) and reasoning.
      
      Customer Name: ${customer.full_name}
      Interest: ${customer.notes || "Not specified"}
      Budget: $${customer.target_budget_min} - $${customer.target_budget_max}
      Priority: ${customer.priority}
      Current Status: ${customer.lead_status}
      
      Evaluation Criteria:
      - Budget clarity and viability.
      - Specificity of their notes/requests.
      - Urgency (Priority).
      
      Return the response in STRICT JSON format with these keys:
      "score": (Integer between 1 and 100)
      "reasoning": (One concise paragraph explaining the AI's logic)
      
      Output only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Scoring Error:", error);
    return null;
  }
};
