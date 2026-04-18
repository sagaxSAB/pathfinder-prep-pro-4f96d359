import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert career advisor with deep knowledge of global labor markets, AI's impact on jobs, and learning pathways. You give practical, specific, honest advice. Avoid fluff. Use plain language a curious 18-year-old could understand.`;

const TOOL = {
  type: "function",
  function: {
    name: "career_profile",
    description: "Return a structured profile for a given career.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string", description: "2-3 sentences in plain language describing what this role actually does day to day." },
        salary: {
          type: "object",
          properties: {
            entry: { type: "string" },
            mid: { type: "string" },
            senior: { type: "string" },
            currency_note: { type: "string", description: "Note about region/currency assumptions." },
          },
          required: ["entry", "mid", "senior", "currency_note"],
          additionalProperties: false,
        },
        technical_skills: { type: "array", items: { type: "string" } },
        soft_skills: { type: "array", items: { type: "string" } },
        ai_impact: {
          type: "object",
          properties: {
            score: { type: "number", description: "0 = no AI disruption, 10 = highly automatable." },
            explanation: { type: "string" },
          },
          required: ["score", "explanation"],
          additionalProperties: false,
        },
        future_outlook: { type: "string", description: "5-10 year outlook in 2-3 sentences." },
        roadmap: {
          type: "array",
          description: "Ordered learning roadmap with 4-6 steps.",
          items: {
            type: "object",
            properties: {
              step: { type: "string" },
              detail: { type: "string" },
              duration: { type: "string" },
            },
            required: ["step", "detail", "duration"],
            additionalProperties: false,
          },
        },
        related_careers: { type: "array", items: { type: "string" } },
        immediate_action: { type: "string", description: "One concrete step the user can take this week." },
      },
      required: [
        "title",
        "summary",
        "salary",
        "technical_skills",
        "soft_skills",
        "ai_impact",
        "future_outlook",
        "roadmap",
        "related_careers",
        "immediate_action",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string" || title.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Generate a complete career profile for: ${title.trim()}` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "career_profile" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No tool call returned");
    const profile = JSON.parse(args);

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
