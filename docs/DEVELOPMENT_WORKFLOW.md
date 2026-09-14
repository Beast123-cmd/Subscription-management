# Development Workflow

## Shared dependencies

The repository uses one `pnpm` workspace and one committed `pnpm-lock.yaml`.

- Root `package.json` owns shared scripts and dev tooling.
- Each app/package declares only dependencies it imports.
- Developers run `pnpm install --frozen-lockfile` after cloning or switching branches; this installs the exact versions in the lockfile.
- Add a dependency with `pnpm add` in its owning workspace, then commit that `package.json` and the root lockfile.
- Turborepo runs `lint`, `typecheck`, `test`, and `build` consistently across workspaces.
- Never commit `node_modules`; manifests and the lockfile reproduce it.

## Shared environment model

Neon is the shared PostgreSQL service. Docker is not part of the initial developer workflow.

| Environment        | Neon branch             | Purpose                                    | Who may migrate                           |
| ------------------ | ----------------------- | ------------------------------------------ | ----------------------------------------- |
| Feature work       | Personal/feature branch | Isolated development and migration testing | Branch owner                              |
| Shared development | `development`           | Team integration and demo environment      | Designated maintainer after review        |
| Production, later  | `production`            | Release traffic and real data              | Release owner through reviewed deployment |

Neon branches are isolated copy-on-write database branches. A feature branch may run experimental migrations without altering the shared development branch. Do not use the shared development branch as a scratch database.

## Environment files and secrets

Commit `.env.example` only. It documents required keys without credentials:

```dotenv
DATABASE_URL=
DATABASE_URL_UNPOOLED=
JWT_SECRET=
PORT=3000
WEB_ORIGIN=http://localhost:5173
```

Actual values belong in a git-ignored `.env.local` or app-specific local env file. Share access through the Neon project and a team password manager or approved secret manager, never through Git, issue comments, chat history, or hard-coded source files.

Use the Neon pooled URL as `DATABASE_URL` for normal application traffic. Use the direct, non-pooled URL as `DATABASE_URL_UNPOOLED` for Prisma migrations, database administration, dumps, and session-dependent operations. Prisma runtime uses the pooled URL; Prisma Migrate uses the direct URL.

## Neon branch workflow

1. Link the workspace to the correct Neon project once with `neon link`.
2. Create or select a feature branch with `neon checkout <feature-branch>`.
3. Pull the branch environment into the ignored local env file with `neon env pull` if checkout did not already do it.
4. Run and verify migrations only against the feature branch.
5. Review the migration and application change in Git.
6. Apply approved migrations to the shared development branch with the direct URL.

The `.neon` project-link file and local environment files are environment configuration and remain git-ignored unless the team deliberately adopts a safe shared Neon configuration file.

## Migration discipline

Prisma schema and migration files are version-controlled in `packages/database`. Every migration is generated, reviewed, and committed with the code that depends on it. Test it on a Neon branch first. Do not use undocumented ad hoc SQL on the shared development database.

For a shared-branch migration: create/verify a branch or recovery point, use `DATABASE_URL_UNPOOLED`, run migration status, smoke-test the API, and record any backfill or rollback plan. Migrations affecting tenant keys, financial data, constraints, or large tables require explicit review.

## Team handoff checklist

- Pull the branch and run `pnpm install --frozen-lockfile`.
- Obtain approved Neon access and pull the correct branch environment.
- Copy `.env.example` only if no local env has been pulled; never overwrite a working secret file blindly.
- Run `pnpm lint`, `pnpm typecheck`, and relevant tests before a pull request.
- Do not run destructive or experimental database commands against `development`.
