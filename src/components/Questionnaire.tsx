import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const QUESTIONS = [
  "What kind of activities make you lose track of time?",
  "Are you more energized by working with people, ideas, data, or things? Why?",
  "What subjects in school did you actually enjoy (not just do well in)?",
  "Describe a problem you solved recently that you're proud of.",
  "Do you prefer structured routine or unpredictable variety in your work?",
  "How important is income vs. meaning vs. flexibility to you right now?",
  "What's a job you've imagined doing but never seriously considered? Why?",
  "What strengths do friends or teachers say you have?",
];

export const Questionnaire = ({
  onDone,
  loading,
}: {
  onDone: (answers: Record<string, string>) => void;
  loading: boolean;
}) => {
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [i, setI] = useState(0);

  const current = answers[i];
  const isLast = i === QUESTIONS.length - 1;
  const progress = ((i + 1) / QUESTIONS.length) * 100;

  function next() {
    if (!current.trim()) return;
    if (isLast) {
      const out: Record<string, string> = {};
      QUESTIONS.forEach((q, idx) => (out[q] = answers[idx]));
      onDone(out);
    } else {
      setI((v) => v + 1);
    }
  }

  return (
    <Card className="p-6 md:p-10 shadow-soft border-border/60 bg-card-gradient max-w-3xl mx-auto">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Question {i + 1} of {QUESTIONS.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-1.5" />

      <h2 className="mt-8 font-display text-2xl md:text-3xl font-semibold leading-snug text-balance">
        {QUESTIONS[i]}
      </h2>

      <Textarea
        value={current}
        onChange={(e) => {
          const v = e.target.value.slice(0, 600);
          const next = [...answers];
          next[i] = v;
          setAnswers(next);
        }}
        placeholder="A sentence or two is plenty…"
        className="mt-6 min-h-[120px] text-base resize-none"
        autoFocus
      />
      <div className="mt-1 text-right text-xs text-muted-foreground">{current.length}/600</div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0 || loading}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={next} variant="hero" size="lg" disabled={!current.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLast ? "Get my matches" : "Next"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
