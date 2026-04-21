# Contributing

The tool descriptions on this site are maintained as Markdown files in [`_tools/`](./_tools/). Each file corresponds to one node in the compatibility tooling map. Corrections, additions, and updates are welcome via pull request.

## Editing a tool description

Every tool has a file at `_tools/<name>.md`. The quickest path is to click **Edit on GitHub** in the detail panel on the map — that opens the file directly in GitHub's editor.

### File structure

```
---
node_id: BCD                          # must match the ID in _data/graph.yml
title: mdn/browser-compat-data        # display name shown in the panel header
link: https://github.com/...          # primary URL (repo, homepage, or docs)
maintainer: Mozilla and community     # who maintains the tool
---

## What it does

One or two paragraphs describing the tool's purpose.

## Who is it for

Who are the primary users or consumers of this tool?

## Where to find it

Links to the tool — repository, live site, npm package, etc.

## Who is maintaining it

Organisation or individuals responsible for the project.
```

Keep each section concise — two to four sentences is enough. If a section genuinely does not apply, omit it rather than writing a placeholder.

### Frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `node_id` | Yes | Must exactly match the `id` in `_data/graph.yml`. Do not change this. |
| `title` | Yes | Human-readable name displayed as the panel heading. |
| `link` | No | The most useful single URL for the tool. Prefer a GitHub repo over a marketing site when both exist. |
| `maintainer` | No | Short description of who maintains it — organisation name is enough. |

## Adding a new tool

1. Add a node (and any edges) to [`_data/graph.yml`](./_data/graph.yml).
2. Create `_tools/<node-id>.md` following the structure above. Use the exact `node_id` you added to the YAML.
3. Open a pull request with both files.

The map and detail panel are generated automatically from these two sources — no other files need changing.

## Running locally

You need Ruby and Jekyll:

```sh
gem install jekyll bundler
bundle install
bundle exec jekyll serve
```

Then open `http://localhost:4000`.

## Guidelines

- Stick to facts. Avoid promotional language.
- Link to primary sources (GitHub repos, official docs) rather than blog posts.
- If you are unsure about a detail, leave it out rather than guessing.
