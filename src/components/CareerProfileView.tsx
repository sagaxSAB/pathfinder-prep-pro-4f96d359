import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Compass, GraduationCap, LineChart, Sparkles, Wrench, Heart, Bot, ArrowRight } from "lucide-react";
import type { CareerProfile } from "@/types/career";
import { cn } from "@/lib/utils";

export const CareerProfileView = ({ profile, className }: { profile: CareerProfile; className?: string }) => {
  const aiPct = (profile.ai_impact.score / 10) * 100;
  return (
    <div className={cn("space-y-6 animate-fade-in-up", className)}>
      <Card className="p-8 bg-hero text-primary-foreground shadow-elegant border-0">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-foreground/15 backdrop-blur">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-highlight font-semibold">Career profile</p>
            <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold">{profile.title}</h2>
          </div>
        </div>
        <p className="mt-5 text-primary-foreground/85 text-lg leading-relaxed max-w-3xl">{profile.summary}</p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold">Salary range</h3>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {([
              ["Entry", profile.salary.entry],
              ["Mid", profile.salary.mid],
              ["Senior", profile.salary.senior],
            ] as const).map(([label, val]) => (
              <div key={label} className="rounded-lg bg-muted/60 p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-0.5 font-semibold text-sm">{val}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{profile.salary.currency_note}</p>
        </Card>

        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold">AI impact</h3>
            <span className="ml-auto text-2xl font-display font-bold text-accent">
              {profile.ai_impact.score}/10
            </span>
          </div>
          <Progress value={aiPct} className="mt-3 h-2" />
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.ai_impact.explanation}</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold">Technical skills</h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.technical_skills.map((s) => (
              <span key={s} className="rounded-full bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-6 bg-card-gradient shadow-soft">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold">Soft skills</h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.soft_skills.map((s) => (
              <span key={s} className="rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Future outlook (5–10 years)</h3>
        </div>
        <p className="mt-3 text-muted-foreground leading-relaxed">{profile.future_outlook}</p>
      </Card>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Learning roadmap</h3>
        </div>
        <ol className="mt-4 space-y-4">
          {profile.roadmap.map((step, i) => (
            <li key={i} className="flex gap-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground font-display font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold">{step.step}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{step.duration}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-6 bg-card-gradient shadow-soft">
        <h3 className="font-display text-lg font-semibold">Related careers</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.related_careers.map((r) => (
            <span key={r} className="rounded-md bg-muted px-3 py-1.5 text-sm">{r}</span>
          ))}
        </div>
      </Card>

      <Card className="p-8 bg-hero text-primary-foreground shadow-elegant border-0">
        <div className="flex items-center gap-2 text-highlight">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">Do this week</span>
        </div>
        <p className="mt-3 text-xl font-display font-semibold leading-snug max-w-3xl">
          {profile.immediate_action}
        </p>
        <a
          href="/resume"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-highlight hover:underline"
        >
          Or sharpen your resume next <ArrowRight className="h-4 w-4" />
        </a>
      </Card>
    </div>
  );
};
