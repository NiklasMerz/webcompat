# web compat tools

Please check [CONTRIBUTING](./CONTRIBUTING.md)

## Run the build

```
bundle exec jekyll serve --baseurl=""
```

## `<tool-graph>` web component

Each tool page on webcompat.dev embeds a `<tool-graph>` custom element that renders a mini force-directed graph with the tool in the centre and its direct connections around it. The component can also be embedded on external sites.

### Embed on an external page

```html
<script src="https://webcompat.dev/assets/js/tool-graph.js"></script>

<tool-graph
  node-id="BCD"
  data-base="https://webcompat.dev">
</tool-graph>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `node-id` | yes | The node ID as defined in `_data/graph.yml` (e.g. `BCD`, `Baseline`, `WPT`) |
| `data-base` | external use | Base URL used to load graph data and resolve logo/page URLs. Omit when embedding on webcompat.dev itself. |
| `show-description` | no | Set to `"false"` to always hide the description panel. Default: enabled — panel appears automatically when the component is at least 500 px wide. |

The component loads D3.js from the CDN automatically if it is not already present on the page. When running on an external site, graph data is loaded by injecting a `<script>` tag pointing to `{data-base}/assets/data/graph-data.js` — this avoids CORS restrictions that would block a `fetch()` request to a different origin.

### Static SVG for GitHub READMEs

Each tool has a pre-generated SVG graph available at:

```
https://webcompat.dev/assets/img/graphs/{nodeId}.svg
```

Embed it in any Markdown file (e.g. a GitHub README):

```markdown
![BCD connections](https://webcompat.dev/assets/img/graphs/BCD.svg)
```

The SVG is generated automatically during the Jekyll build by `_plugins/graph_svg_generator.rb`. It shows the tool centred with incoming and outgoing connections, and supports both dark and light colour schemes via a CSS `prefers-color-scheme` media query.

### Data endpoint

The full graph and tool metadata is available as JSON:

```
https://webcompat.dev/assets/data/graph.json
```

Response shape:

```json
{
  "graph": {
    "nodes": [{ "id": "BCD", "label": "mdn/browser-compat-data" }, ...],
    "edges": [{ "source": "BCD", "target": "WebFeatures" }, ...]
  },
  "tools": {
    "BCD": {
      "name": "mdn/browser-compat-data",
      "link": "https://github.com/mdn/browser-compat-data",
      "maintainer": "Mozilla, Open Web Docs, and community contributors",
      "logo": "/assets/img/logos/bcd.png",
      "url": "/tools/bcd/"
    }
  }
}
```
