# CI in this fork

`element-capacitor` is a fork of [element-hq/element-web](https://github.com/element-hq/element-web)
and inherits its full `.github/workflows/` tree. A large part of that tree is
**upstream's release infrastructure**: nightly builds that sign and deploy to element.io
servers, image pushes to element-hq registries, translation sync, label sync, bot-driven
housekeeping. None of it can work here, because none of the required secrets
(`ELEMENT_BOT_TOKEN`, Localazy keys, signing certificates, registry credentials) exist in
this repository.

Left alone, those workflows fired on their upstream cron schedules — roughly six times a
day — and failed every time, burning Actions minutes and generating a steady stream of
failure notifications that drowned out real CI signal.

## What was changed

The `schedule:` triggers were commented out, in place, in these files:

| Workflow | Old cron | Why it can't work here |
| --- | --- | --- |
| `build-and-test.yaml` | `0 6 * * *` | Nightly full matrix; the same suite already runs on every PR and merge_group in this fork |
| `build_desktop_and_deploy.yaml` | `0 9 * * *` | Nightly desktop build; signs and deploys to element.io infrastructure |
| `docker.yaml` | `0 7/12 * * *` | Publishes `develop` images to element-hq registries |
| `sync-labels.yml` | `0 1 * * *` | Syncs element-hq's label taxonomy; needs `ELEMENT_BOT_TOKEN` |
| `localazy_download.yaml` | `0 6 * * 1,3,5` | Pulls translations; needs Localazy credentials |
| `update-jitsi.yml` | `0 3 * * 0` | Opens a PR via bot; needs `ELEMENT_BOT_TOKEN` |

Only the `schedule:` trigger was touched. Every other trigger is untouched, so these
workflows still run on `pull_request`, `push`, `release`, `workflow_call` and
`workflow_dispatch` exactly as before — including manual runs from the Actions tab.

Each edit is marked with a `# [fork]` comment next to the commented-out cron, so it is
obvious during an upstream merge what the local deviation is and why.

`triage-stale.yml` (`30 1 * * *`) was deliberately left enabled: it succeeds here and
produces no noise.

## Merging upstream

When `upstream/develop` changes one of these `on:` blocks you will get a small conflict at
the commented-out cron. Resolve it by keeping the commented form and re-applying any
upstream change *inside* the comment, so the record of upstream's real schedule stays
accurate.

To re-enable one of these nightlies, uncomment its `schedule:` block — but note that
it will only start firing once the change reaches this repository's **default branch**
(`david-release`), since GitHub runs `schedule:` triggers from the default branch only.
