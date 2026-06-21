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

interface KnowledgeEntry {
  keywords: string[];
  answer: string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ["file", "complaint", "register", "submit", "lodge"],
    answer:
      "To file a complaint on JanSeva:\n\n1. Go to the File Complaint page\n2. Fill in your name, email, contact number, and complaint description\n3. Select the relevant category (Infrastructure, Public Services, Health & Safety, etc.)\n4. Submit the form\n5. You'll receive a Complaint ID (e.g., CMP20240115-1234)\n\nOur AI will automatically analyze your complaint, assign it to the correct department, and set a priority level. You can track its status anytime on the Track Complaint page.",
  },
  {
    keywords: ["track", "status", "check", "where", "my complaint"],
    answer:
      "To track your complaint:\n\n1. Go to the Track Complaint page\n2. Enter your Complaint ID (e.g., CMP20240115-1234)\n3. Click Search\n\nYou'll see the current status (Submitted, Assigned, In Progress, Resolved), the assigned department, priority level, and any officer notes. The status updates in real-time as officers process your complaint.",
  },
  {
    keywords: ["scheme", "scholarship", "eligible", "eligibility", "pm-kisan", "pm kisam", "ayushman", "awas", "housing"],
    answer:
      "To find schemes you're eligible for:\n\n1. Visit the Government Schemes page\n2. Use the Scheme Recommendation Engine on the home page\n3. Enter your age, income, occupation, state, gender, category, and education\n4. Our AI will match you with real government schemes like:\n\n• National Scholarship Portal — up to Rs. 50,000/year for students\n• PM-KISAN Samman Nidhi — Rs. 6,000/year for farmers\n• Ayushman Bharat — up to Rs. 5 lakhs health coverage\n• PM Awas Yojana — housing subsidies\n• Sukanya Samriddhi Yojana — savings for girl children\n\nThe recommendations are personalized based on your profile.",
  },
  {
    keywords: ["birth", "certificate", "death", "document", "documents", "required"],
    answer:
      "For a birth/death certificate, you typically need:\n\n• Hospital discharge summary or birth/death occurrence report\n• Parent's Aadhaar card\n• Address proof (ration card, voter ID, or utility bill)\n• Proof of birth (hospital certificate)\n\nProcess:\n1. Visit your municipal corporation office or the state's online portal\n2. Submit the application with required documents\n3. Pay the applicable fee\n4. Certificate is issued within 7-21 working days\n\nNote: Requirements vary by state. Check your state's municipal website for specifics.",
  },
  {
    keywords: ["ration", "card", "food"],
    answer:
      "To apply for a ration card:\n\nRequired documents:\n• Aadhaar cards of all family members\n• Address proof\n• Income certificate\n• Bank passbook\n• Passport-size photographs\n\nProcess:\n1. Apply online at your state's food and supplies portal, or visit the rationing office\n2. Submit the application form with documents\n3. Verification takes 15-30 days\n4. Card is issued and linked to your Aadhaar\n\nRation cards are categorized: AAY (Antyodaya Anna Yojana), BPL, and APL.",
  },
  {
    keywords: ["aadhaar", "uid", "enroll"],
    answer:
      "For Aadhaar-related services:\n\n• New enrollment: Visit any Aadhaar Seva Kendra with proof of identity, address, and date of birth\n• Updates: Name, address, mobile, and biometric updates can be done online (myaadhaar.uidai.gov.in) or at Seva Kendra\n• Download: e-Aadhaar is available instantly online after enrollment\n\nAadhaar is required for most government services and scheme benefits.",
  },
  {
    keywords: ["helpline", "emergency", "contact", "number", "call", "help"],
    answer:
      "Important helpline numbers:\n\n• Emergency: 112\n• Women's Helpline: 1091\n• Child Helpline: 1098\n• Citizen's Grievance Portal (CPGRAMS): pgportal.gov.in\n• Aadhaar Helpline: 1947\n• PM-KISAN Helpline: 1800115526\n• Ayushman Bharat: 14555\n\nFor municipal services, contact your local municipal corporation office.",
  },
  {
    keywords: ["officer", "dashboard", "resolve", "assign", "status update"],
    answer:
      "The Officer Dashboard allows government officers to:\n\n• View all submitted complaints\n• Assign complaints to departments\n• Mark complaints as In Progress\n• Resolve or reject complaints\n• Filter by priority (including Emergency and High Priority)\n\nOfficers can access it at the /officer route. When an officer updates a complaint's status, citizens see the change immediately on the Track Complaint page.",
  },
  {
    keywords: ["hello", "hi", "hey", "greeting", "namaste"],
    answer:
      "Hello! I'm the JanSeva Assistant. I can help you with:\n\n• Filing and tracking complaints\n• Government scheme recommendations\n• Required documents for services (birth certificates, ration cards, Aadhaar)\n• General government service queries\n• Helpline numbers\n\nWhat would you like help with today?",
  },
  {
    keywords: ["water", "electricity", "road", "garbage", "sewage", "infrastructure"],
    answer:
      "For infrastructure-related issues (water supply, electricity, roads, garbage, sewage):\n\n1. File a complaint on JanSeva with a clear description\n2. Select the appropriate category (Infrastructure, Utilities, etc.)\n3. Our AI will route it to the correct department:\n   • Water issues → Water Supply & Sewerage Board\n   • Electricity → Electricity Distribution Company\n   • Roads → Municipal Corporation - Roads Division\n   • Garbage/Sanitation → Public Health Department\n\nYou'll receive a Complaint ID to track the resolution. If it's an emergency (e.g., live wire, major water leak), indicate urgency — it will be flagged for 24-48 hour response.",
  },
];

function findFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }
  return `I'm here to help with government services. I can assist you with:

• Filing and tracking complaints
• Government scheme eligibility (PM-KISAN, Ayushman Bharat, scholarships, housing)
• Required documents for birth certificates, ration cards, Aadhaar
• Helpline numbers and emergency contacts
• General municipal service queries

Could you provide more details about what you need? For example, you can ask "How do I file a complaint?" or "What schemes am I eligible for?"`;
}

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
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // If no API key is configured, use the built-in knowledge base fallback
    // so the assistant remains functional for citizens.
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set — using fallback knowledge base.");
      const fallback = findFallbackResponse(message);
      return new Response(
        JSON.stringify({ response: fallback }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      // Fall back to knowledge base instead of failing hard
      const fallback = findFallbackResponse(message);
      return new Response(
        JSON.stringify({ response: fallback }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || findFallbackResponse(message);

    return new Response(
      JSON.stringify({ response: text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        response: "I apologize, but I'm having trouble responding right now. Please try again in a moment, or browse our Help section for common government service queries.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
