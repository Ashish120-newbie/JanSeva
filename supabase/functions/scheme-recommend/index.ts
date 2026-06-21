import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a government welfare scheme advisor for the JanSeva platform. Your role is to recommend Indian government schemes that a citizen may be eligible for, based on their profile.

Return ONLY a valid JSON array — no markdown, no code fences, no commentary. Each element must be an object with exactly these fields:
{
  "title": full scheme name,
  "category": one of ["Education", "Agriculture", "Women Welfare", "Healthcare", "Housing", "Senior Citizens", "Employment", "Other"],
  "benefits": concise description of the benefit (e.g., "Up to Rs. 50,000/year for tuition"),
  "reason": one sentence explaining why this citizen is eligible based on their profile,
  "matchScore": integer 1-100 indicating eligibility confidence
}

Guidelines:
- Recommend 3-6 schemes that genuinely match the citizen's profile.
- Be factual — use real Indian government schemes (e.g., National Scholarship Portal, PM-KISAN, Ayushman Bharat, PM Awas Yojana, Sukanya Samriddhi Yojana, Indira Gandhi National Old Age Pension, National Rural Employment Guarantee Act, Pradhan Mantri Matru Vandana Yojana, etc.).
- If the citizen is a student or young person, prioritize education/scholarship schemes.
- If the citizen is a farmer or in agriculture, prioritize farmer welfare schemes.
- If the citizen is a woman, include women-specific schemes.
- If the citizen is 60+, include senior citizen/pension schemes.
- If the citizen's income is low, prioritize income-based welfare schemes.
- Consider category (SC/ST/OBC), disability status, and gender when relevant.
- Never fabricate scheme names — use only real, active government schemes.
- If the profile is too vague to make targeted recommendations, return general welfare schemes that most citizens qualify for.`;

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

    const profile = await req.json();

    if (!profile || typeof profile !== "object") {
      return new Response(
        JSON.stringify({ error: "Profile data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileLines: string[] = [];
    if (profile.age) profileLines.push(`Age: ${profile.age}`);
    if (profile.gender) profileLines.push(`Gender: ${profile.gender}`);
    if (profile.occupation) profileLines.push(`Occupation: ${profile.occupation}`);
    if (profile.income) profileLines.push(`Annual family income: Rs. ${profile.income}`);
    if (profile.category) profileLines.push(`Social category: ${profile.category}`);
    if (profile.state) profileLines.push(`State: ${profile.state}`);
    if (profile.education) profileLines.push(`Education: ${profile.education}`);
    if (profile.disability) profileLines.push(`Disability status: ${profile.disability}`);

    if (profileLines.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one profile field is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `${SYSTEM_PROMPT}

Citizen profile:
${profileLines.join("\n")}

Return a JSON array of 3-6 recommended schemes.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 2048,
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
        JSON.stringify({ error: "Failed to generate recommendations" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let recommendations: unknown;
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      recommendations = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return new Response(
        JSON.stringify({ error: "Failed to parse recommendations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recommendations could be generated for this profile" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valid = recommendations.every(
      (r) => typeof r === "object" && r !== null && "title" in r && "benefits" in r
    );

    if (!valid) {
      console.error("Invalid recommendation structure:", JSON.stringify(recommendations));
      return new Response(
        JSON.stringify({ error: "Invalid recommendation format received" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ recommendations }),
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
