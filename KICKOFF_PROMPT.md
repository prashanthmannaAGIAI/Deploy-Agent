# Prompts to paste into Claude Code

## First session (paste once)

You are building the Deploy Agent product described in CLAUDE.md in this folder. Read CLAUDE.md in full, then open docs/prototype/runway-prototype.html and study every screen and interaction; it is the UI source of truth.

Setup:
1. This folder is the local working copy. Initialise git if needed and set the remote to https://github.com/prashanthmannaAGIAI/Deploy-Agent.git. If the remote already has commits, pull them first and tell me what is there before changing anything.
2. Check which prerequisites are installed (git, Node 20+, pnpm, Python 3.12, uv, Docker, Terraform, AWS CLI, gcloud). Tell me what is missing and how to install it; do not install system-level software without asking.
3. Confirm you can push to the remote. If authentication fails, stop and tell me what to set up.

Then start Phase 0 from CLAUDE.md. Write the plan into docs/PROGRESS.md first, build it, run the checks, commit, push, and stop with a summary of what you built, how I can run it, and anything you need from me for Phase 1.

## Every later session (paste each time)

Read CLAUDE.md and docs/PROGRESS.md. Continue with the next unfinished phase. Plan first, then build, test, commit on a phase branch, push, open a pull request, and stop with a summary. If you need credentials, a GitHub App, or a decision from me, ask instead of faking it.

## When something breaks

The last session left <describe the problem>. Read docs/PROGRESS.md, reproduce the issue, find the root cause, fix it with a test that would have caught it, and summarise what went wrong.
