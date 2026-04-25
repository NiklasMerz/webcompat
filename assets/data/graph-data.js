---
layout: null
---
window.__webcompatData = {
  graph: {
    nodes: {{ site.data.graph.nodes | jsonify }},
    edges: {{ site.data.graph.edges | jsonify }}
  },
  tools: {
    {% for tool in site.tools %}
    {{ tool.node_id | jsonify }}: {
      name: {{ tool.title | jsonify }},
      link: {{ tool.link | jsonify }},
      maintainer: {{ tool.maintainer | jsonify }},
      logo: {{ tool.logo | jsonify }},
      url: {{ tool.url | jsonify }},
      excerpt: {% assign _parts = tool.content | split: '</h2>' %}{% capture _no_h2 %}{% for _p in _parts %}{% if forloop.last %}{{ _p }}{% else %}{{ _p | split: '<h2' | first }}{% endif %}{% endfor %}{% endcapture %}{{ _no_h2 | strip_html | strip | truncate: 280 | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  }
};
