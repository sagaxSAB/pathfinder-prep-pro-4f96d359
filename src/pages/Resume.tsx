import { useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { extractPdfText } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Upload, Loader2, Sparkles, CheckCircle2, AlertTriangle, Target, KeyRound, Wand2,
} from "lucide-react";
import type { ResumeFeedback } from "@/types/career";

const Resume = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"" | "extracting" | "analyzing">("");
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("PDF must be under 8MB.");
      return;
    }
    setFile(f);
    setFeedback(null);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setFeedback(null);
    try {
      setStage("extracting");
      const text = await extractPdfText(file);
      if (!text || text.length < 50) {
        throw new Error("Could not extract text from PDF. Is it a scanned image?");
      }
      setStage("analyzing");
      const { data, error } = await supabase.functions.invoke("resume-analyze", {
        body: { resumeText: text, targetRole: targetRole.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFeedback(data.feedback);
      window.scrollTo({ top: 400, behavior: "smooth" });
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  return (
    <PageShell>
      <section className="container py-14">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Resume Analyzer</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Upload your resume PDF. We extract the text in your browser, send it to AI for analysis,
          and never store the file.
        </p>

        <Card className="mt-8 p-6 md:p-8 bg-card-gradient shadow-soft border-border/60 max-w-3xl">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/50 p-10 text-center cursor-pointer hover:border-accent transition-base"
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="mt-4 font-semibold">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Choose a different file
                </Button>
              </>
            ) : (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-accent">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 font-semibold">Drop your resume PDF here</p>
                <p className="text-sm text-muted-foreground">or click to browse · max 8MB</p>
              </>
            )}
          </label>

          <div className="mt-6">
            <label className="text-sm font-medium">Target role <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value.slice(0, 120))}
              placeholder="e.g. Senior Frontend Engineer"
              className="mt-2"
            />
          </div>

          <Button
            variant="hero"
            size="lg"
            className="mt-6 w-full"
            disabled={!file || loading}
            onClick={analyze}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {stage === "extracting" ? "Reading PDF…" : stage === "analyzing" ? "Analyzing…" : "Analyze resume"}
          </Button>
        </Card>

        {feedback && <FeedbackView feedback={feedback} />}
      </section>
    </PageShell>
  );
};

const FeedbackView = ({ feedback }: { feedback: ResumeFeedback }) => {
  const score = feedback.overall_score;
  const tone =
    score >= 80 ? "text-success" : score >= 60 ? "text-accent" : score >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="mt-10 space-y-6 animate-fade-in-up">
      <Card className="p-8 bg-hero text-primary-foreground border-0 shadow-elegant">
        <div className="flex flex-wrap items-center gap-6 justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-highlight font-semibold">Overall score</p>
            <h2 className="mt-2 font-display text-5xl font-bold">{score}<span className="text-2xl text-primary-foreground/60">/100</span></h2>
          </div>
          <p className="text-primary-foreground/85 max-w-xl text-balance">{feedback.summary}</p>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><h3 className="font-display text-lg font-semibold">Strengths</h3></div>
          <ul className="mt-3 space-y-2 text-sm">
            {feedback.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-success">✓</span><span>{s}</span></li>)}
          </ul>
        </Card>
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /><h3 className="font-display text-lg font-semibold">Weaknesses</h3></div>
          <ul className="mt-3 space-y-2 text-sm">
            {feedback.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-warning">!</span><span>{s}</span></li>)}
          </ul>
        </Card>
      </div>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-accent" /><h3 className="font-display text-lg font-semibold">ATS keywords</h3></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Present</p>
            <div className="flex flex-wrap gap-1.5">
              {feedback.ats_keywords.present.map((k) => (
                <span key={k} className="text-xs rounded-full bg-success/10 text-success border border-success/30 px-2.5 py-1">{k}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {feedback.ats_keywords.missing.map((k) => (
                <span key={k} className="text-xs rounded-full bg-destructive/10 text-destructive border border-destructive/30 px-2.5 py-1">{k}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2"><Target className="h-5 w-5 text-accent" /><h3 className="font-display text-lg font-semibold">Skill gaps</h3></div>
          <ul className="mt-3 space-y-2 text-sm">
            {feedback.skill_gaps.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </Card>
        <Card className="p-6 bg-card-gradient shadow-soft">
          <h3 className="font-display text-lg font-semibold">Clarity & formatting</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {feedback.clarity_issues.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
          {feedback.missing_sections.length > 0 && (
            <>
              <h4 className="mt-5 font-semibold text-sm">Missing sections</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {feedback.missing_sections.map((m) => (
                  <span key={m} className="text-xs rounded-full bg-muted px-2.5 py-1">{m}</span>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-accent" /><h3 className="font-display text-lg font-semibold">Improved bullet points</h3></div>
        <div className="mt-4 space-y-4">
          {feedback.improved_bullets.map((b, i) => (
            <div key={i} className="rounded-lg border border-border/60 overflow-hidden">
              <div className="bg-destructive/5 px-4 py-3 text-sm">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Before</span>
                <p className="mt-1">{b.before}</p>
              </div>
              <div className="bg-success/5 px-4 py-3 text-sm border-t border-border/60">
                <span className="text-xs font-semibold text-success uppercase tracking-wider">After</span>
                <p className="mt-1">{b.after}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <h3 className="font-display text-lg font-semibold">Rewritten summary</h3>
        <p className="mt-3 text-sm leading-relaxed bg-muted/40 p-4 rounded-lg">{feedback.rewritten_summary}</p>
      </Card>
    </div>
  );
};

export default Resume;
