import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL = {
  type: "function",
  function: {
    name: "resume_feedback",
    description: "Provide structured feedback on a resume.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "number", description: "0-100" },
        summary: { type: "string", description: "2-3 sentence overall verdict." },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        clarity_issues: { type: "array", items: { type: "string" } },
        ats_keywords: {
          type: "object",
          properties: {
            present: { type: "array", items: { type: "string" } },
            missing: { type: "array", items: { type: "string" } },
          },
          required: ["present", "missing"],
          additionalProperties: false,
        },
        skill_gaps: { type: "array", items: { type: "string" } },
        improved_bullets: {
          type: "array",
          description: "3-5 improved versions of weak bullet points.",
          items: {
            type: "object",
            properties: {
              before: { type: "string" },
              after: { type: "string" },
            },
            required: ["before", "after"],
            additionalProperties: false,
          },
        },
        rewritten_summary: { type: "string", description: "A rewritten professional summary section." },
        missing_sections: { type: "array", items: { type: "string" } },
      },
      required: [
        "overall_score", "summary", "strengths", "weaknesses",
        "clarity_issues", "ats_keywords", "skill_gaps",
        "improved_bullets", "rewritten_summary", "missing_sections",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, targetRole } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "Invalid resume text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Cap input length
    const trimmed = resumeText.slice(0, 25000);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const role = (targetRole && typeof targetRole === "string") ? targetRole.slice(0, 120) : "general professional roles";

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior technical recruiter and resume coach. Be specific, concrete, and constructive. Reference actual phrases from the resume when giving feedback. Never invent experience the candidate doesn't have.",
          },
          {
            role: "user",
            content: `Target role: ${role}\n\nResume text:\n\n${trimmed}`,
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "resume_feedback" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text(); console.error(t);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const feedback = JSON.parse(args);
    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
