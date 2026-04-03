# TODO

- [x] Verified workflow wiring in `/home/runner/work/SAD-aI/SAD-aI/.github/workflows/run-remaining.yml`:
  - Push: `develop`, `main`
  - Schedule: `0 * * * *`
  - Manual: `workflow_dispatch` with toggles (`run_ci_checks`, `run_backend_remaining`, `run_deploy`, `environment`, `image_tag`)
  - Uses required secrets/vars (`DATABASE_URL`, `OPENAI_API_KEY`, deploy webhooks, `HEALTHCHECK_URL`, optional tuning vars)

- [ ] Add repository secrets:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `STAGING_DEPLOY_WEBHOOK_URL`
  - `PRODUCTION_DEPLOY_WEBHOOK_URL`

- [ ] Add environment variable per environment (`staging`, `production`):
  - `HEALTHCHECK_URL`

- [ ] (Optional) Add tuning vars:
  - `RUN_REMAINING_BATCH_SIZE`
  - `RUN_REMAINING_MAX_BATCHES`
  - `DB_MIGRATIONS_DIR`

- [ ] Confirm environment protections/reviewers for `staging` and `production`.

- [ ] Manually trigger **Run Remaining Work** once and confirm all jobs pass.

- [ ] Ensure `run-remaining.yml` is on the branch GitHub Actions is using (typically default branch), since API currently returns `404` for `run-remaining.yml` workflow runs.

- [ ] After triggering, share the workflow run ID so logs can be reviewed for end-to-end confirmation.
