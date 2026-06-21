import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a senior grievance redressal officer for a municipal government system (JanSeva). Your role is to analyze citizen complaints with the precision and professionalism expected of a government official.

Your analysis must be objective, evidence-based, and actionable. Avoid speculation beyond what the complaint states. Use formal administrative language.`;

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

    const prompt = `${SYSTEM_PROMPT}

Analyze the following citizen complaint and produce a structured assessment for the departmental workflow. Respond ONLY with a valid JSON object — no markdown, no code fences, no commentary before or after.

Complaint description: "${description}"
${category ? `Citizen-selected category: "${category}"` : ""}

Return a JSON object with EXACTLY these fields:
{
  "category": one of ["Infrastructure", "Public Services", "Health & Safety", "Environment", "Transportation", "Utilities", "Education", "Revenue", "Other"],
  "department": the official name of the responsible government department (e.g., "Municipal Corporation — Roads Division", "Water Supply & Sewerage Board", "Public Health Department", "Electricity Distribution Company", "Revenue Department", "Department of Education"),
  "priority": one of ["low", "medium", "high", "urgent"],
  "estimatedResolution": a realistic resolution timeframe string (e.g., "24-48 hours", "3-5 working days", "7-14 working days"),
  "officerSummary": a concise 1-2 sentence professional summary of the core issue, written for reviewing officials — state the problem factually and its public impact,
  "nextAction": the single most appropriate immediate next step the assigned officer should take (e.g., "Dispatch field inspector to verify location", "Coordinate with water board for emergency supply", "Review road safety audit and schedule repair", "Forward to health officer for sanitation inspection")
}

Priority guidelines:
- "urgent": imminent threat to life, safety, or critical public infrastructure (e.g., open manholes, electrical hazards, sewage overflow in residential areas, structural damage)
- "high": risks to public safety or services affecting multiple residents (e.g., non-functional streetlights, water contamination concerns, road potholes on main routes)
- "medium": standard service requests requiring routine attention (e.g., garbage accumulation, minor water leaks, delayed documentation)
- "low": minor inconveniences, suggestions, or non-urgent inquiries (e.g., cleanliness feedback, a single non-critical streetlight, general information requests)

Estimated resolution should reflect realistic government operational timelines:
- urgent: within 24-48 hours
- high: 3-5 working days
- medium: 7-14 working days
- low: 14-21 working days

The officerSummary and nextAction must be professional, specific, and directly actionable — avoid generic placeholders.`;

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
            maxOutputTokens: 800,
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

    let analysis;
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requiredFields = ["category", "priority", "department", "estimatedResolution", "officerSummary", "nextAction"];
    const missing = requiredFields.filter((f) => !analysis[f]);
    if (missing.length > 0) {
      console.error("Incomplete AI analysis, missing fields:", missing);
      return new Response(
        JSON.stringify({ error: "Incomplete AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    const priority = validPriorities.includes(analysis.priority.toLowerCase())
      ? analysis.priority.toLowerCase()
      : "medium";

    const result = {
      category: analysis.category,
      priority,
      department: analysis.department,
      estimatedResolution: analysis.estimatedResolution,
      officerSummary: analysis.officerSummary,
      nextAction: analysis.nextAction,
      // Keep summary as an alias for backward compatibility with the ai_summary column.
      summary: analysis.officerSummary,
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
