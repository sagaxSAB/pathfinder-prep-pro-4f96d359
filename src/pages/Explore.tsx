import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Compass, HelpCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CareerProfileView } from "@/components/CareerProfileView";
import { Questionnaire } from "@/components/Questionnaire";
import type { CareerProfile, CareerRecommendation } from "@/types/career";

const POPULAR = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Mechanical Engineer",
  "Marketing Manager",
];

const Explore = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get("mode") === "quiz" ? "quiz" : "search";

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[] | null>(null);

  async function fetchProfile(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setProfile(null);
    try {
      const { data, error } = await supabase.functions.invoke("career-profile", {
        body: { title: query.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProfile(data.profile);
      window.scrollTo({ top: 400, behavior: "smooth" });
    } catch (e: any) {
      toast.error(e.message || "Failed to load career profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuizDone(answers: Record<string, string>) {
    setLoading(true);
    setRecommendations(null);
    try {
      const { data, error } = await supabase.functions.invoke("career-recommend", {
        body: { answers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations);
    } catch (e: any) {
      toast.error(e.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container relative py-14">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-balance max-w-2xl">
            Explore your next career
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Search a specific role, or take a 90-second quiz if you're not sure where to start.
          </p>

          <div className="mt-8 inline-flex rounded-xl border border-border bg-card p-1 shadow-soft">
            <button
              onClick={() => setParams({})}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-base ${
                mode === "search" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="h-4 w-4" /> Search a role
            </button>
            <button
              onClick={() => setParams({ mode: "quiz" })}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-base ${
                mode === "quiz" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle className="h-4 w-4" /> I'm not sure
            </button>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        {mode === "search" ? (
          <Card className="p-6 md:p-8 shadow-soft border-border/60 bg-card-gradient">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchProfile(title);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Electrical Engineer, UX Designer…"
                maxLength={120}
                className="h-12 text-base"
              />
              <Button type="submit" size="lg" variant="hero" disabled={loading || !title.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate profile
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Try:</span>
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setTitle(p);
                    fetchProfile(p);
                  }}
                  className="text-xs rounded-full border border-border bg-background px-3 py-1.5 hover:bg-muted transition-base"
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <Questionnaire onDone={handleQuizDone} loading={loading} />
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-10 grid place-items-center py-16">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground animate-pulse-ring">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-4 text-muted-foreground">Thinking through your career…</p>
          </div>
        )}

        {/* Search result */}
        {profile && !loading && <CareerProfileView profile={profile} className="mt-10" />}

        {/* Quiz recommendations */}
        {recommendations && !loading && (
          <div className="mt-10 space-y-4">
            <h2 className="font-display text-2xl font-bold">Your top matches</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Card key={rec.title} className="p-6 shadow-soft hover:shadow-elegant transition-base bg-card-gradient">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">{rec.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {rec.tags.map((t) => (
                          <span key={t} className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl font-bold text-accent">{rec.match}%</div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{rec.why}</p>
                  <Button
                    onClick={() => {
                      setParams({});
                      setTitle(rec.title);
                      fetchProfile(rec.title);
                    }}
                    variant="accent"
                    size="sm"
                    className="mt-4"
                  >
                    Explore in detail <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
};

export default Explore;
