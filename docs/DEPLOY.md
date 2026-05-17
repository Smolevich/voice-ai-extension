# Deployment & release control with `gh`

Everything that ships to the Chrome Web Store and Firefox AMO is built by GitHub Actions, not by a laptop. This doc collects the `gh` CLI commands you actually use to drive that pipeline.

Prerequisites:
- `brew install gh`
- `gh auth login` once (already done — you're authenticated as `Smolevich`)

---

## Watch CI on the current branch

```bash
gh run list --limit 10                       # last 10 workflow runs
gh run list --workflow=ci.yml --limit 5      # only CI runs
gh run watch                                 # pick a running job, stream output until it finishes
gh run watch <run-id>                        # watch a specific run
```

If a run failed and you want the full picture:

```bash
gh run view <run-id>                         # job summary
gh run view <run-id> --log                   # full logs to stdout
gh run view <run-id> --log-failed            # only the failed steps' logs
```

Re-run a failed job without pushing again:

```bash
gh run rerun <run-id>                        # re-run everything
gh run rerun <run-id> --failed               # only failed jobs
```

## Download a CI build to test locally

CI uploads `chrome-extension/` and `firefox-extension/` as artifacts on every run. To grab them:

```bash
gh run download <run-id> --name chrome-extension --dir /tmp/voice-ai-chrome
gh run download <run-id> --name firefox-extension --dir /tmp/voice-ai-firefox
```

Then load `/tmp/voice-ai-chrome` as an unpacked extension to validate the exact build that CI produced.

---

## Cut a release

Releases are triggered by pushing a tag matching `v*`. The release workflow rebuilds, lints, zips, and creates a GitHub Release with both zips attached.

```bash
# 1. Bump version in package.json (e.g. 0.1.0 → 0.1.1)
#    crxjs reads it for the manifest.
$EDITOR package.json

# 2. Commit the bump
git add package.json
git commit -m "Release v0.1.1"

# 3. Tag and push
git tag v0.1.1
git push origin main --tags

# 4. Watch the release workflow
gh run watch
```

When the run finishes, the release exists with two zips attached. Verify:

```bash
gh release list                              # see all releases
gh release view v0.1.1                       # title, notes, assets
gh release download v0.1.1                   # pull the zips into the current dir
```

If something is wrong with the release notes or you need to attach an extra file:

```bash
gh release edit v0.1.1 --notes "..."         # rewrite notes
gh release upload v0.1.1 some-extra-asset    # add another file
gh release delete v0.1.1                     # nuke (and delete tag manually if you also want that gone)
```

## Submit the zips to the stores

There are no `gh` commands here — Chrome Web Store and Firefox AMO submissions go through their own dashboards. The workflow:

1. `gh release download v0.1.1` — pull both zips locally
2. Upload `voice-ai-extension-chrome-v0.1.1.zip` to https://chrome.google.com/webstore/devconsole
3. Upload `voice-ai-extension-firefox-v0.1.1.zip` to https://addons.mozilla.org/developers/

Copy descriptions, permission justifications, and screenshots from `docs/SUBMISSION.md`.

---

## Pull request workflow

```bash
gh pr create --fill                          # opens a PR using your last commit message as the body
gh pr list                                   # open PRs on the repo
gh pr view <number>                          # title, body, checks, reviews
gh pr checks <number>                        # CI status for a specific PR
gh pr merge <number> --squash --delete-branch
```

If a PR is failing CI and you want to re-run only the failed jobs:

```bash
gh pr checks <number>                        # find the failing check
gh run list --branch <branch-name> --limit 3 # locate its run id
gh run rerun <run-id> --failed
```

## Issues

```bash
gh issue list                                # open issues
gh issue view <number>
gh issue create --title "..." --body "..."
gh issue close <number>
```

---

## Status of the latest release pipeline at a glance

```bash
gh release list --limit 5 \
  && echo "" \
  && gh run list --workflow=release.yml --limit 5
```

## Common knobs you forget exist

```bash
gh repo view --web                           # open the repo in your browser
gh browse                                    # open the current branch in your browser
gh api repos/Smolevich/voice-ai-extension/actions/runs --jq '.workflow_runs[0:3] | .[] | {id, name, status, conclusion}'
```

---

## Emergency: stop a runaway workflow

```bash
gh run list --limit 5                        # find the running id
gh run cancel <run-id>
```

If a release tag was pushed by mistake and the workflow is racing toward GitHub Release creation:

```bash
gh run cancel <run-id>                       # stop the workflow first
git tag -d v0.1.x                            # delete tag locally
git push --delete origin v0.1.x              # delete tag on origin
```

Note: deleting a tag is one of the few git destructive operations that's worth confirming before running. Don't delete tags that already produced a published release on the stores.
