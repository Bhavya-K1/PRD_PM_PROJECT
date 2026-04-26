# PRD Copilot

PRD Copilot is a lightweight AI PM workflow tool. It turns a rough feature idea into a structured PRD draft with:

- problem framing
- proposed solution
- user stories
- acceptance criteria
- success metrics
- risks
- launch notes

## Why this project

This project is designed to show applied AI PM thinking rather than generic chatbot wrapping. The goal is to explore how AI can speed up PM first drafts while keeping the output structured and reviewable.

## Day 1 scope

- Feature input form
- One API endpoint
- Structured JSON PRD response
- Human-readable PRD output page
- Markdown export
- Fallback offline draft mode when no API key is configured

## Day 2 scope

- PM review layer with draft readiness, strengths, concerns, and next steps
- Missing-information detector to highlight unanswered planning gaps
- Local draft history so recent PRDs can be reopened and iterated
- Warmer, more polished product UI with stronger review ergonomics

## Stack

- Next.js 14
- React
- OpenAI API

## Getting started

1. Move into the project directory
   `cd "/Users/bhavya/Documents/PM projects/prd-copilot"`
2. Install dependencies
   `npm install`
3. Copy `.env.example` to `.env.local` if needed
4. Add your `OPENAI_API_KEY` to `.env.local`
5. Run the app
   `npm run dev`
6. Open `http://localhost:3000`

## Future improvements

- Regenerate individual sections
- Save and compare versions across sessions or teammates
- Jira / Notion export
- Collaboration and commenting workflows
