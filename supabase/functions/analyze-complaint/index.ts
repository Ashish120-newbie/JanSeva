import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { description, category } = await req.json();

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Analyze the following citizen complaint and provide a structured analysis. Respond ONLY with a valid JSON object (no markdown, no code blocks, just the raw JSON).

Complaint description: "${description}"
${category ? `User selected category: "${category}"` : ''}

Analyze and return a JSON object with exactly these fields:
{
  "category": one of ["Infrastructure", "Public Services", "Health & Safety", "Environment", "Transportation", "Utilities", "Education", "Revenue", "Other"],
  "priority": one of ["low", "medium", "high", "urgent"],
  "department": the most appropriate government department name,
  "summary": a brief 1-2 sentence summary of the core issue
}

Guidelines:
- Priority "urgent": life-threatening, major accidents, critical infrastructure failure
- Priority "high": safety hazards, issues affecting many people
- Priority "medium": standard complaints requiring attention
- Priority "low": minor inconveniences, suggestions
- Department should be specific (e.g., "Roads & Transport", "Water Supply", "Public Health", "Sanitation", "Electricity", "Education", "Revenue")
- Summary should capture the essence for quick review by officials`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 500,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to analyze complaint" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response from Gemini
    let analysis;
    try {
      // Remove any potential markdown code block markers
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the analysis has required fields
    if (!analysis.category || !analysis.priority || !analysis.department || !analysis.summary) {
      return new Response(
        JSON.stringify({ error: "Incomplete AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Estimate resolution time based on priority
    const resolutionDays: Record<string, string> = {
      urgent: "1-2 days",
      high: "3-5 days",
      medium: "7-14 days",
      low: "14-21 days",
    };

    const result = {
      category: analysis.category,
      priority: analysis.priority.toLowerCase(),
      department: analysis.department,
      summary: analysis.summary,
      estimatedResolution: resolutionDays[analysis.priority.toLowerCase()] || "7-14 days",
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
