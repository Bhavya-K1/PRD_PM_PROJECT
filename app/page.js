"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const STORAGE_KEY = "prd-copilot-history";

const initialForm = {
  featureName: "",
  targetUser: "",
  problemStatement: "",
  goal: "",
  constraints: "",
  context: "",
};

const sampleForm = {
  featureName: "Clinical Handover Summary Assistant",
  targetUser: "Hospital clinicians during shift handovers",
  problemStatement:
    "Clinicians lose time manually reviewing fragmented chart updates during shift changes, increasing the risk of missed context.",
  goal: "Reduce handover review time while improving summary completeness and clinician confidence.",
  constraints:
    "Must be explainable, source-grounded, and suitable for regulated healthcare workflows.",
  context:
    "Enterprise healthcare product with multi-patient charting workflows and strong reliability requirements.",
};

function Section({ title, items, ordered = false }) {
  if (!items?.length) return null;
  const ListTag = ordered ? "ol" : "ul";
  return (
    <section className={styles.resultSection}>
      <h3>{title}</h3>
      <ListTag>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SavedDraftCard({ draft, onLoad }) {
  return (
    <button type="button" className={styles.savedDraftCard} onClick={() => onLoad(draft)}>
      <strong>{draft.result.feature_name}</strong>
      <span>{draft.result.target_user}</span>
      <span>{draft.generatedAt}</span>
    </button>
  );
}

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState("");
  const [history, setHistory] = useState([]);

  const canSubmit = useMemo(() => {
    return (
      form.featureName.trim() &&
      form.targetUser.trim() &&
      form.problemStatement.trim() &&
      form.goal.trim()
    );
  }, [form]);

  const completedCoreFields = useMemo(() => {
    return [
      form.featureName,
      form.targetUser,
      form.problemStatement,
      form.goal,
    ].filter((value) => value.trim()).length;
  }, [form]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      // Ignore malformed local history and continue with a clean state.
    }
  }, []);

  useEffect(() => {
    if (!history.length) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveDraft(nextForm, nextResult, generatedAt) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      form: nextForm,
      result: nextResult,
      generatedAt,
    };

    setHistory((current) => [entry, ...current].slice(0, 6));
  }

  function loadSavedDraft(draft) {
    setForm(draft.form);
    setResult(draft.result);
    setLastGeneratedAt(draft.generatedAt);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong while generating the PRD.");
      }

      const generatedAt = new Date().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });

      setResult(data);
      setLastGeneratedAt(generatedAt);
      saveDraft(form, data, generatedAt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function exportMarkdown() {
    if (!result) return;

    const lines = [
      `# ${result.feature_name}`,
      "",
      "## Target User",
      result.target_user,
      "",
      "## Problem",
      result.problem,
      "",
      "## Goal",
      result.goal,
      "",
      "## Proposed Solution",
      result.proposed_solution,
      "",
      "## User Stories",
      ...result.user_stories.map((item) => `- ${item}`),
      "",
      "## Acceptance Criteria",
      ...result.acceptance_criteria.map((item) => `- ${item}`),
      "",
      "## Success Metrics",
      ...result.success_metrics.map((item) => `- ${item}`),
      "",
      "## Risks",
      ...result.risks.map((item) => `- ${item}`),
      "",
      "## Launch Notes",
      ...result.launch_notes.map((item) => `- ${item}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "prd-draft.md";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Your PM writing partner</p>
          <h1>PRD Copilot</h1>
          <p className={styles.subtitle}>
            Turn a rough product thought into a draft that feels structured, grounded, and ready
            for a real team conversation.
          </p>
          <div className={styles.heroNotes}>
            <span>Built for first drafts, not blank pages.</span>
            <span>Keeps the output practical and reviewable.</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <div className={styles.heroMark} aria-hidden="true">
            <div className={styles.heroMarkOuter}>
              <div className={styles.heroMarkInner}>
                <span className={styles.heroMarkStem} />
                <span className={styles.heroMarkLeaf} />
                <span className={styles.heroMarkDot} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setForm(sampleForm)}
          >
            Load sample
          </button>
          <div className={styles.heroCard}>
            <p>Best results come from one clear user problem and one clear outcome.</p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Feature Input</h2>
            <p>Give it just enough context that a thoughtful teammate could run with it.</p>
          </div>

          <div className={styles.statsRow}>
            <Stat label="Core fields" value={`${completedCoreFields}/4`} />
            <Stat label="Constraints" value={form.constraints.trim() ? "Added" : "Open"} />
            <Stat label="Context" value={form.context.trim() ? "Added" : "Optional"} />
          </div>

          <div className={styles.tip}>
            <strong>Helpful prompt:</strong> Write the problem the way a user or operator would
            describe it on a difficult day.
          </div>

          {history.length ? (
            <section className={styles.historyPanel}>
              <div className={styles.historyHeader}>
                <h3>Recent drafts</h3>
                <p>Pick up where you left off.</p>
              </div>
              <div className={styles.historyList}>
                {history.map((draft) => (
                  <SavedDraftCard key={draft.id} draft={draft} onLoad={loadSavedDraft} />
                ))}
              </div>
            </section>
          ) : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Feature name
              <input
                value={form.featureName}
                onChange={(e) => updateField("featureName", e.target.value)}
                placeholder="e.g. AI release notes summarizer"
              />
            </label>

            <label>
              Target user
              <input
                value={form.targetUser}
                onChange={(e) => updateField("targetUser", e.target.value)}
                placeholder="e.g. PMs managing weekly product launches"
              />
            </label>

            <label>
              Problem statement
              <textarea
                rows={5}
                value={form.problemStatement}
                onChange={(e) => updateField("problemStatement", e.target.value)}
                placeholder="Describe the pain point clearly."
              />
            </label>

            <label>
              Goal
              <textarea
                rows={3}
                value={form.goal}
                onChange={(e) => updateField("goal", e.target.value)}
                placeholder="What should improve if this feature works?"
              />
            </label>

            <label>
              Constraints
              <textarea
                rows={3}
                value={form.constraints}
                onChange={(e) => updateField("constraints", e.target.value)}
                placeholder="Compliance, time, technical, budget, or UX constraints."
              />
            </label>

            <label>
              Context or competitor notes
              <textarea
                rows={3}
                value={form.context}
                onChange={(e) => updateField("context", e.target.value)}
                placeholder="Optional product context, user context, or competitive signal."
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <button className={styles.primaryButton} type="submit" disabled={!canSubmit || loading}>
              {loading ? "Generating..." : "Generate PRD"}
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>PRD Draft</h2>
              <p>A draft you can react to, edit down, or take into a planning review.</p>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={exportMarkdown}
              disabled={!result}
            >
              Export markdown
            </button>
          </div>

          {!result ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIllustration}>
                <span />
                <span />
                <span />
              </div>
              <h3>Your draft will show up here</h3>
              <p>Once you generate it, we will lay out the problem, approach, risks, and what success should look like.</p>
            </div>
          ) : (
            <div className={styles.results}>
              <div className={styles.resultBanner}>
                <div>
                  <p className={styles.resultLabel}>Draft ready</p>
                  <h3>{result.feature_name}</h3>
                </div>
                <p>{lastGeneratedAt ? `Generated ${lastGeneratedAt}` : "Generated just now"}</p>
              </div>

              <section className={styles.resultSection}>
                <p className={styles.meta}><strong>Target user:</strong> {result.target_user}</p>
                <p><strong>Problem:</strong> {result.problem}</p>
                <p><strong>Goal:</strong> {result.goal}</p>
                <p><strong>Proposed solution:</strong> {result.proposed_solution}</p>
              </section>

              <Section title="User Stories" items={result.user_stories} />
              <Section title="Acceptance Criteria" items={result.acceptance_criteria} />
              <Section title="Success Metrics" items={result.success_metrics} />
              <Section title="Risks" items={result.risks} />
              <Section title="Launch Notes" items={result.launch_notes} />

              <section className={styles.reviewGrid}>
                <div className={styles.reviewCard}>
                  <p className={styles.reviewLabel}>Readiness</p>
                  <h3>{result.pm_review?.readiness || "First draft ready for review"}</h3>
                  <p>
                    This is the current PM read on how planning-ready the draft feels, given the
                    framing and evidence provided.
                  </p>
                </div>

                <div className={styles.reviewCard}>
                  <p className={styles.reviewLabel}>Missing Information</p>
                  {result.missing_information?.length ? (
                    <ul>
                      {result.missing_information.map((item, index) => (
                        <li key={`missing-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No major gaps flagged in the current input.</p>
                  )}
                </div>
              </section>

              <section className={styles.reviewGrid}>
                <div className={styles.reviewCard}>
                  <p className={styles.reviewLabel}>What is working</p>
                  <ul>
                    {(result.pm_review?.strengths || []).map((item, index) => (
                      <li key={`strength-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.reviewCard}>
                  <p className={styles.reviewLabel}>Watchouts</p>
                  <ul>
                    {(result.pm_review?.concerns || []).map((item, index) => (
                      <li key={`concern-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <Section title="Recommended Next Steps" items={result.pm_review?.next_steps} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
