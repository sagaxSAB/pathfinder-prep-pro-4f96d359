import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mic, MicOff, Loader2, Sparkles, RotateCcw, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb, Square,
} from "lucide-react";
import type { InterviewQuestion, AnswerFeedback, InterviewSummary } from "@/types/career";

type Stage = "setup" | "answering" | "transcribing" | "feedback" | "summary";

const Interview = () => {
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("setup");
  const [loading, setLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [results, setResults] = useState<{ q: InterviewQuestion; transcript: string; feedback: AnswerFeedback }[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startInterview() {
    if (!role.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview", {
        body: { action: "questions", role: role.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuestions(data.questions);
      setIdx(0);
      setStage("answering");
      setResults([]);
      setSummary(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => onRecordingStopped();
      rec.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e: any) {
      toast.error("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
  }

  async function onRecordingStopped() {
    setStage("transcribing");
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size < 1000) {
        toast.error("Recording too short");
        setStage("answering");
        return;
      }
      const base64 = await blobToBase64(blob);

      const { data: tData, error: tErr } = await supabase.functions.invoke("transcribe", {
        body: { audio: base64, mime_type: "audio/webm" },
      });
      if (tErr) throw tErr;
      if (tData?.error) throw new Error(tData.error);
      const text = (tData.transcript || "").trim();
      if (!text) throw new Error("Could not transcribe audio");
      setTranscript(text);

      const q = questions![idx];
      const { data: fData, error: fErr } = await supabase.functions.invoke("interview", {
        body: { action: "feedback", role: role.trim(), question: q.question, transcript: text },
      });
      if (fErr) throw fErr;
      if (fData?.error) throw new Error(fData.error);
      setFeedback(fData.feedback);
      setStage("feedback");
    } catch (e: any) {
      toast.error(e.message || "Failed to process answer");
      setStage("answering");
    }
  }

  async function nextQuestion() {
    if (!feedback || !questions) return;
    const q = questions[idx];
    const newResults = [...results, { q, transcript, feedback }];
    setResults(newResults);
    setFeedback(null);
    setTranscript("");
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setStage("answering");
    } else {
      // final summary
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("interview", {
          body: { action: "summary", role: role.trim(), results: newResults.map((r) => ({ question: r.q.question, feedback: r.feedback })) },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setSummary(data.summary);
        setStage("summary");
      } catch (e: any) {
        toast.error(e.message || "Failed to generate summary");
      } finally {
        setLoading(false);
      }
    }
  }

  function reset() {
    setStage("setup");
    setQuestions(null);
    setIdx(0);
    setRole("");
    setTranscript("");
    setFeedback(null);
    setResults([]);
    setSummary(null);
  }

  return (
    <PageShell>
      <section className="container py-14">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">AI Voice Interview</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Practice real interview questions out loud. We transcribe your answer and score
          clarity, confidence, relevance, and structure.
        </p>

        {stage === "setup" && (
          <Card className="mt-8 p-6 md:p-8 bg-card-gradient shadow-soft max-w-2xl">
            <label className="text-sm font-medium">Target role</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value.slice(0, 120))}
              placeholder="e.g. Software Engineer, Product Manager…"
              className="mt-2 h-12 text-base"
              onKeyDown={(e) => e.key === "Enter" && startInterview()}
            />
            <Button variant="hero" size="lg" className="mt-5 w-full" disabled={loading || !role.trim()} onClick={startInterview}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start interview (5 questions)
            </Button>
          </Card>
        )}

        {questions && stage !== "setup" && stage !== "summary" && (
          <div className="mt-8 max-w-3xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Question {idx + 1} of {questions.length}</span>
              <span className="capitalize">{questions[idx].type}</span>
            </div>
            <Progress value={((idx + (stage === "feedback" ? 1 : 0)) / questions.length) * 100} className="h-1.5" />

            <Card className="mt-6 p-8 bg-card-gradient shadow-soft">
              <p className="text-xs uppercase tracking-widest text-accent font-semibold">Question</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold leading-snug text-balance">
                {questions[idx].question}
              </h2>
              <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>{questions[idx].tip}</span>
              </div>
            </Card>

            {stage === "answering" && (
              <Card className="mt-6 p-8 bg-card-gradient shadow-soft text-center">
                {!recording ? (
                  <>
                    <p className="text-muted-foreground mb-6">Click the mic, answer out loud (1–2 min), then stop.</p>
                    <button
                      onClick={startRecording}
                      className="grid h-24 w-24 mx-auto place-items-center rounded-full bg-hero text-primary-foreground shadow-elegant hover:scale-105 transition-base"
                    >
                      <Mic className="h-10 w-10" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6">Recording… speak naturally.</p>
                    <button
                      onClick={stopRecording}
                      className="grid h-24 w-24 mx-auto place-items-center rounded-full bg-destructive text-destructive-foreground shadow-elegant animate-pulse-ring hover:scale-105 transition-base"
                    >
                      <Square className="h-9 w-9 fill-current" />
                    </button>
                    <div className="mt-4 font-display text-2xl font-bold tabular-nums">
                      {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                    </div>
                  </>
                )}
              </Card>
            )}

            {stage === "transcribing" && (
              <Card className="mt-6 p-12 bg-card-gradient shadow-soft text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-accent" />
                <p className="mt-4 text-muted-foreground">Transcribing & analyzing your answer…</p>
              </Card>
            )}

            {stage === "feedback" && feedback && (
              <FeedbackCard
                transcript={transcript}
                feedback={feedback}
                onNext={nextQuestion}
                isLast={idx + 1 >= (questions?.length ?? 0)}
                loading={loading}
              />
            )}
          </div>
        )}

        {stage === "summary" && summary && (
          <SummaryView summary={summary} onReset={reset} />
        )}
      </section>
    </PageShell>
  );
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-sm mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}/10</span>
    </div>
    <Progress value={value * 10} className="h-1.5" />
  </div>
);

const FeedbackCard = ({
  transcript, feedback, onNext, isLast, loading,
}: { transcript: string; feedback: AnswerFeedback; onNext: () => void; isLast: boolean; loading: boolean }) => (
  <div className="mt-6 space-y-6 animate-fade-in-up">
    <Card className="p-6 bg-card-gradient shadow-soft">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your answer</p>
      <p className="mt-2 text-sm leading-relaxed bg-muted/40 p-4 rounded-lg italic">"{transcript}"</p>
    </Card>

    <Card className="p-6 bg-card-gradient shadow-soft">
      <h3 className="font-display text-lg font-semibold">Scores</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ScoreBar label="Clarity" value={feedback.clarity} />
        <ScoreBar label="Confidence" value={feedback.confidence} />
        <ScoreBar label="Relevance" value={feedback.relevance} />
        <ScoreBar label="Structure" value={feedback.structure} />
      </div>
      {feedback.filler_words.length > 0 && (
        <div className="mt-4 text-sm">
          <span className="text-muted-foreground">Filler words detected: </span>
          {feedback.filler_words.map((f) => (
            <span key={f} className="inline-block rounded bg-warning/15 text-warning px-2 py-0.5 text-xs mr-1.5">
              {f}
            </span>
          ))}
        </div>
      )}
    </Card>

    <Card className="p-6 bg-card-gradient shadow-soft">
      <p className="font-medium">{feedback.quick_summary}</p>
      <h4 className="mt-4 font-semibold text-sm">Try this</h4>
      <ul className="mt-2 space-y-1.5 text-sm">
        {feedback.improvements.map((s, i) => <li key={i} className="flex gap-2"><span className="text-accent">→</span><span>{s}</span></li>)}
      </ul>
      <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">Stronger version</p>
        <p className="text-sm leading-relaxed">{feedback.better_answer}</p>
      </div>
    </Card>

    <Button variant="hero" size="lg" onClick={onNext} disabled={loading} className="w-full">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {isLast ? "Get full review" : "Next question"} <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

const SummaryView = ({ summary, onReset }: { summary: InterviewSummary; onReset: () => void }) => (
  <div className="mt-8 space-y-6 animate-fade-in-up max-w-3xl">
    <Card className="p-8 bg-hero text-primary-foreground border-0 shadow-elegant">
      <p className="text-xs uppercase tracking-widest text-highlight font-semibold">Overall score</p>
      <h2 className="mt-2 font-display text-6xl font-bold">{summary.overall_score}<span className="text-2xl text-primary-foreground/60">/100</span></h2>
    </Card>
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><h3 className="font-display text-lg font-semibold">Strengths</h3></div>
        <ul className="mt-3 space-y-2 text-sm">{summary.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
      </Card>
      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /><h3 className="font-display text-lg font-semibold">Weaknesses</h3></div>
        <ul className="mt-3 space-y-2 text-sm">{summary.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}</ul>
      </Card>
    </div>
    <Card className="p-6 bg-card-gradient shadow-soft">
      <h3 className="font-display text-lg font-semibold">Improvement plan</h3>
      <ol className="mt-3 space-y-2 text-sm">
        {summary.improvement_plan.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-bold">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </Card>
    <Button variant="outline" size="lg" onClick={onReset} className="w-full">
      <RotateCcw className="h-4 w-4" /> Try another role
    </Button>
  </div>
);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result as string;
      // r looks like "data:audio/webm;base64,XXXX"
      resolve(r.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default Interview;
