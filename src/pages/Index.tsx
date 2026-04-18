import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { Compass, FileText, Mic, Sparkles, ArrowRight, Brain, Target, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Career Exploration",
    desc: "Search any role or take a short quiz. Get salary, AI impact, skills, roadmap, and a real next step.",
    href: "/explore",
    cta: "Explore careers",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    desc: "Upload your PDF resume. We score it, find ATS keyword gaps, and rewrite weak bullets for you.",
    href: "/resume",
    cta: "Analyze resume",
  },
  {
    icon: Mic,
    title: "AI Voice Interview",
    desc: "Practice real interview questions out loud. Get scored on clarity, confidence, relevance, and structure.",
    href: "/interview",
    cta: "Start practicing",
  },
];

const stats = [
  { icon: Brain, label: "AI-powered", value: "Gemini" },
  { icon: Target, label: "Match scoring", value: "0–100%" },
  { icon: TrendingUp, label: "Career outlook", value: "5–10 yr" },
];

const Index = () => {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur mb-6">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Career discovery → preparation → execution
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
              Find the right career.
              <span className="block bg-gradient-to-r from-secondary via-accent to-highlight bg-clip-text text-transparent">
                Get ready to land it.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Helm is your AI co-pilot for the full career journey — from exploring options
              to nailing the interview that gets you hired.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="xl" variant="hero">
                <Link to="/explore">
                  Start exploring <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/explore?mode=quiz">I'm not sure yet</Link>
              </Button>
            </div>

            <div className="mt-14 grid grid-cols-3 max-w-xl mx-auto gap-4">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
                  <Icon className="h-5 w-5 mx-auto text-accent" />
                  <div className="mt-2 text-sm font-semibold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, href, cta }, i) => (
            <Link
              key={title}
              to={href}
              className="group relative rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-soft transition-base hover:shadow-elegant hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-hero text-primary-foreground shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-display font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{desc}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Differentiator strip */}
      <section className="container pb-24">
        <div className="rounded-3xl bg-hero p-10 md:p-14 text-primary-foreground shadow-elegant">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-highlight font-semibold">Why Helm</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-balance">
              Most tools tell you about a job. Helm asks if you're ready for it.
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              We connect career discovery with the prep work that actually matters: a sharper resume
              and live interview practice with feedback you'd pay a coach for.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default Index;
