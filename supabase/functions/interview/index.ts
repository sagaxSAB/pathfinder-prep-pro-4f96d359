import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUESTIONS_TOOL = {
  type: "function",
  function: {
    name: "interview_questions",
    description: "Generate role-specific interview questions.",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              type: { type: "string", enum: ["behavioral", "technical", "situational"] },
              tip: { type: "string", description: "One short tip on how to approach answering." },
            },
            required: ["question", "type", "tip"],
            additionalProperties: false,
          },
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
  },
};

const FEEDBACK_TOOL = {
  type: "function",
  function: {
    name: "answer_feedback",
    description: "Score and give feedback on an interview answer.",
    parameters: {
      type: "object",
      properties: {
        clarity: { type: "number", description: "0-10" },
        confidence: { type: "number", description: "0-10, based on filler words, hedging, structure." },
        relevance: { type: "number", description: "0-10, did they actually answer the question." },
        structure: { type: "number", description: "0-10, logical flow (e.g. STAR)." },
        filler_words: { type: "array", items: { type: "string" } },
        quick_summary: { type: "string", description: "1-2 sentence verdict." },
        improvements: { type: "array", items: { type: "string" }, description: "1-2 actionable improvements." },
        better_answer: { type: "string", description: "A short improved version of the answer." },
      },
      required: [
        "clarity", "confidence", "relevance", "structure",
        "filler_words", "quick_summary", "improvements", "better_answer",
      ],
      additionalProperties: false,
    },
  },
};

const FINAL_TOOL = {
  type: "function",
  function: {
    name: "interview_summary",
    description: "Final overall interview review.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "number", description: "0-100" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        improvement_plan: { type: "array", items: { type: "string" }, description: "Concrete next steps." },
      },
      required: ["overall_score", "strengths", "weaknesses", "improvement_plan"],
      additionalProperties: false,
    },
  },
};

async function callAI(body: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const action = body?.action;

  try {
    if (action === "questions") {
      const role = String(body.role || "").slice(0, 120);
      if (!role) {
        return new Response(JSON.stringify({ error: "Missing role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const resp = await callAI({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an experienced hiring manager who gives realistic, role-appropriate interview questions." },
          { role: "user", content: `Generate 5 interview questions for a ${role} candidate. Mix behavioral, technical, and situational. Make them specific, not generic.` },
        ],
        tools: [QUESTIONS_TOOL],
        tool_choice: { type: "function", function: { name: "interview_questions" } },
      });
      if (!resp.ok) throw new Error(`AI ${resp.status}`);
      const data = await resp.json();
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "feedback") {
      const { question, transcript, role } = body;
      if (!question || !transcript) {
        return new Response(JSON.stringify({ error: "Missing question or transcript" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const resp = await callAI({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a strict but fair interview coach. Analyze the candidate's transcribed spoken answer. Detect filler words ('um', 'uh', 'like', 'you know', 'basically'), hedging, and structure. Score honestly — most real answers are 5-7, not 9-10.",
          },
          {
            role: "user",
            content: `Role: ${String(role || "general").slice(0,120)}\nQuestion: ${String(question).slice(0,500)}\n\nCandidate transcript:\n"""${String(transcript).slice(0,5000)}"""`,
          },
        ],
        tools: [FEEDBACK_TOOL],
        tool_choice: { type: "function", function: { name: "answer_feedback" } },
      });
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!resp.ok) throw new Error(`AI ${resp.status}`);
      const data = await resp.json();
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      return new Response(JSON.stringify({ feedback: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "summary") {
      const { role, results } = body;
      const resp = await callAI({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You synthesize an overall interview review from per-answer feedback." },
          { role: "user", content: `Role: ${String(role || "general").slice(0,120)}\n\nPer-answer feedback:\n${JSON.stringify(results).slice(0,8000)}` },
        ],
        tools: [FINAL_TOOL],
        tool_choice: { type: "function", function: { name: "interview_summary" } },
      });
      if (!resp.ok) throw new Error(`AI ${resp.status}`);
      const data = await resp.json();
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      return new Response(JSON.stringify({ summary: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
