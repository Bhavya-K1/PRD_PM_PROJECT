import OpenAI from "openai";

const SYSTEM_PROMPT = `
You are a product manager copilot.
Generate a concise but useful PRD draft for an early-stage feature proposal.
Return valid JSON only.
Do not wrap the JSON in markdown.
Do not invent numeric business outcomes unless clearly framed as a proposed metric.
The JSON schema is:
{
  "feature_name": string,
  "target_user": string,
  "problem": string,
  "goal": string,
  "proposed_solution": string,
  "user_stories": string[],
  "acceptance_criteria": string[],
  "success_metrics": string[],
  "risks": string[],
  "launch_notes": string[],
  "missing_information": string[],
  "pm_review": {
    "readiness": string,
    "strengths": string[],
    "concerns": string[],
    "next_steps": string[]
  }
}
`;

function fallbackDraft(payload) {
  return {
    feature_name: payload.featureName,
    target_user: payload.targetUser,
    problem: payload.problemStatement,
    goal: payload.goal,
    proposed_solution:
      "Draft an MVP that directly addresses the core problem, validates user value quickly, and respects the listed constraints.",
    user_stories: [
      `As a ${payload.targetUser}, I want a simpler way to handle ${payload.featureName} so that I can reduce manual effort and improve decision-making.`,
      "As a product team member, I want clear success criteria so that the feature can be validated after launch.",
    ],
    acceptance_criteria: [
      "The MVP solves the primary user problem described in the input.",
      "The workflow is understandable, testable, and usable without extensive manual workarounds.",
      "Success can be measured with at least one operational metric and one user outcome metric.",
    ],
    success_metrics: [
      "Reduction in time spent on the target workflow.",
      "Improvement in completion, adoption, or satisfaction for the target user flow.",
    ],
    risks: [
      "The problem statement may still be too broad for a first MVP.",
      "Missing domain constraints or stakeholder needs could reduce output quality.",
    ],
    launch_notes: [
      "Validate assumptions with 3-5 user or stakeholder conversations before committing to a larger roadmap.",
      "Define a small pilot workflow and measure baseline performance before launch.",
    ],
    missing_information: buildMissingInformation(payload),
    pm_review: buildFallbackReview(payload),
  };
}

function buildMissingInformation(payload) {
  const missing = [];

  if (!payload.constraints?.trim()) {
    missing.push("Key constraints are still open, so tradeoffs may be underspecified.");
  }

  if (!payload.context?.trim()) {
    missing.push("Product or workflow context is limited, which can make scope decisions less grounded.");
  }

  if (!/baseline|today|current|existing|now/i.test(payload.goal || "")) {
    missing.push("There is no clear baseline for how the current workflow performs today.");
  }

  if (!/who|team|owner|stakeholder/i.test(payload.context || "")) {
    missing.push("Ownership, stakeholder alignment, or rollout dependencies are not yet explicit.");
  }

  return missing;
}

function buildFallbackReview(payload) {
  const missingInformation = buildMissingInformation(payload);
  const readiness =
    missingInformation.length === 0
      ? "Strong draft foundation"
      : missingInformation.length <= 2
        ? "Promising, with a few gaps"
        : "Useful first draft, but needs more framing";

  return {
    readiness,
    strengths: [
      "The user problem and intended outcome are clear enough to support a first-pass PRD.",
      "The draft is structured for review, with enough surface area to discuss scope and risk.",
    ],
    concerns: missingInformation.length
      ? missingInformation
      : ["The draft is solid overall, but still needs real stakeholder review before planning."],
    next_steps: [
      "Pressure-test the problem statement with one or two real user examples.",
      "Confirm what success metric will move first in a pilot or MVP launch.",
      "Trim the first release to the smallest workflow that can demonstrate value.",
    ],
  };
}

function normalizeDraft(data, payload) {
  return {
    feature_name: data.feature_name || payload.featureName,
    target_user: data.target_user || payload.targetUser,
    problem: data.problem || payload.problemStatement,
    goal: data.goal || payload.goal,
    proposed_solution: data.proposed_solution || "",
    user_stories: Array.isArray(data.user_stories) ? data.user_stories : [],
    acceptance_criteria: Array.isArray(data.acceptance_criteria) ? data.acceptance_criteria : [],
    success_metrics: Array.isArray(data.success_metrics) ? data.success_metrics : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    launch_notes: Array.isArray(data.launch_notes) ? data.launch_notes : [],
    missing_information: Array.isArray(data.missing_information)
      ? data.missing_information
      : buildMissingInformation(payload),
    pm_review: {
      readiness: data.pm_review?.readiness || buildFallbackReview(payload).readiness,
      strengths: Array.isArray(data.pm_review?.strengths) ? data.pm_review.strengths : [],
      concerns: Array.isArray(data.pm_review?.concerns)
        ? data.pm_review.concerns
        : buildMissingInformation(payload),
      next_steps: Array.isArray(data.pm_review?.next_steps) ? data.pm_review.next_steps : [],
    },
  };
}

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload.featureName || !payload.targetUser || !payload.problemStatement || !payload.goal) {
      return Response.json(
        { error: "Feature name, target user, problem statement, and goal are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(fallbackDraft(payload));
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userPrompt = `
Feature name: ${payload.featureName}
Target user: ${payload.targetUser}
Problem statement: ${payload.problemStatement}
Goal: ${payload.goal}
Constraints: ${payload.constraints || "None provided"}
Context: ${payload.context || "None provided"}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const rawText = response.output_text?.trim();
    if (!rawText) {
      return Response.json({ error: "Model returned an empty response." }, { status: 500 });
    }

    const parsed = JSON.parse(rawText);
    return Response.json(normalizeDraft(parsed, payload));
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to generate PRD draft." },
      { status: 500 }
    );
  }
}
