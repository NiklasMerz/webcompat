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
      url: {{ tool.url | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  }
};
