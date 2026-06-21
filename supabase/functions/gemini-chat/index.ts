import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the JanSeva Assistant, an AI-powered citizen service agent for the Indian municipal government. Your role is to provide accurate, professional guidance on government services to citizens.

## Core Responsibilities
- Help citizens file complaints, track their status, and understand government procedures
- Provide information on welfare schemes, eligibility criteria, and required documents
- Guide users through government service processes (birth/death certificates, ration cards, etc.)
- Escalate urgent matters appropriately

## Response Guidelines
- Be concise and direct — citizens seek clarity, not length. Keep responses under 200 words unless the citizen specifically asks for detailed steps.
- Use plain, accessible language. Avoid bureaucratic jargon when a simple phrase works.
- Structure responses with short paragraphs or numbered lists for step-by-step instructions.
- Be factual. If you do not know something, say so and direct the citizen to the appropriate office or helpline.
- Maintain a respectful, professional tone throughout — you represent a government service.
- Reference real Indian government schemes, departments, and processes accurately (e.g., PM-KISAN, Ayushman Bharat, Aadhaar, National Scholarship Portal, municipal services).
- Never fabricate complaint IDs, application numbers, or official contact details.
- When a citizen reports a grievance, encourage them to file it formally through the File Complaint feature so it enters the official workflow.

## Key Escalation Numbers (provide when relevant)
- Women's Helpline: 1091
- Child Helpline: 1098
- Emergency: 112
- Citizen's Grievance Portal (CPGRAMS): pgportal.gov.in

Keep every response professional, realistic, and actionable.`;

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

    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I am the JanSeva Assistant and will respond professionally, concisely, and accurately to citizen queries." }] },
    ];

    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.5,
            topK: 30,
            topP: 0.9,
            maxOutputTokens: 1024,
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
        JSON.stringify({ error: "Failed to get response from Gemini" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return new Response(
      JSON.stringify({ response: text }),
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
