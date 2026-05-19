# PairWise Development Workflow

PairWise uses a staging-first release flow.

## Branches

- `develop` is the active development branch.
- `main` is the production branch.

## Default Flow

1. Make all ongoing app changes on `develop`.
2. Push `develop`.
3. Deploy and test changes on staging:
   - `https://staging-budget.ugonkwocha.com`
4. Only merge `develop` into `main` after explicit production release approval.
5. Deploy `main` to production:
   - `https://budget.ugonkwocha.com`

## Production Rule

Do not merge to `main` or deploy production unless the user explicitly approves a production release with language such as:

- "release to production"
- "merge to main"
- "deploy production"

## Environment Responsibilities

- Staging should use staging Supabase and staging Vercel preview/alias configuration.
- Production should use production Supabase and Vercel production configuration.
- Keep `main` production-ready at all times.

## Codex Instruction

When working in this repo, Codex should:

1. Start from `develop` for normal changes.
2. Commit and push changes to `develop`.
3. Deploy `develop` to staging for review.
4. Wait for explicit approval before merging into `main`.
5. Deploy production only from `main`.
