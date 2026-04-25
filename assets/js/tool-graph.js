(function () {
  class ToolGraph extends HTMLElement {
    static get observedAttributes() { return ['node-id']; }

    connectedCallback() { this._init(); }
    attributeChangedCallback() { if (this.isConnected) this._init(); }

    async _init() {
      const nodeId = this.getAttribute('node-id');
      if (!nodeId) return;

      if (typeof d3 === 'undefined') {
        await _loadScript('https://d3js.org/d3.v7.min.js');
      }

      let graphData, toolData;
      if (window.graphData) {
        graphData = window.graphData;
        toolData = window.toolData || {};
      } else {
        // Load data via script tag — avoids CORS restrictions on static hosting
        const base = this.getAttribute('data-base') || 'https://webcompat.dev';
        try {
          await _loadScript(`${base}/assets/data/graph-data.js`);
          graphData = window.__webcompatData.graph;
          toolData = window.__webcompatData.tools;
        } catch {
          return;
        }

        // Resolve relative paths now that we know the base
        Object.values(toolData).forEach(t => {
          if (t.logo && !t.logo.startsWith('http')) t.logo = base + t.logo;
          if (t.url && !t.url.startsWith('http')) t.url = base + t.url;
        });
      }

      this._detachShadow();
      this._render(nodeId, graphData, toolData);
    }

    _detachShadow() {
      // Reset shadow root if re-rendering after attribute change
      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = '';
      }
    }

    _render(nodeId, graphData, toolData) {
      const { nodes: allNodes, edges: allEdges } = graphData;

      if (!allNodes.find(n => n.id === nodeId)) return;

      // Build subgraph: center node + direct neighbors
      const connectedIds = new Set([nodeId]);
      allEdges.forEach(e => {
        if (e.source === nodeId || e.target === nodeId) {
          connectedIds.add(e.source);
          connectedIds.add(e.target);
        }
      });

      const nodes = allNodes.filter(n => connectedIds.has(n.id)).map(n => ({ ...n }));
      const edges = allEdges.filter(e =>
        (e.source === nodeId || e.target === nodeId) &&
        connectedIds.has(e.source) && connectedIds.has(e.target)
      );
      const links = edges.map(e => ({ source: e.source, target: e.target }));

      // Shadow DOM
      const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>
          :host { display: block; }
          .wrap {
            background: transparent;
            border: 1px solid #1e2540;
            border-radius: 8px;
            overflow: hidden;
          }
          svg { display: block; width: 100%; }
          .foot {
            padding: 0.5rem 0.75rem;
            border-top: 1px solid #1a2035;
            font-size: 0.7rem;
            font-family: system-ui, sans-serif;
            color: #505878;
          }
          .foot a {
            color: #5a8adc;
            text-decoration: none;
          }
          .foot a:hover { text-decoration: underline; }
        </style>
        <div class="wrap">
          <svg id="g" height="280" role="img" aria-label="Connection graph for ${nodeId}"></svg>
          <div class="foot">
            ${toolData[nodeId]?.name ?? nodeId} is part of a large landscape of webcompat tools. Check out <a href="https://webcompat.dev" target="_blank" rel="noopener noreferrer">webcompat.dev</a> to learn more.
          </div>
        </div>
      `;

      const svgEl = shadow.getElementById('g');

      // Defer so the element is laid out and clientWidth is available
      requestAnimationFrame(() => this._drawD3(svgEl, nodeId, nodes, links, toolData));
    }

    _drawD3(svgEl, nodeId, nodes, links, toolData) {
      const W = this.clientWidth || 680;
      const H = 280;

      svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const logos = {};
      nodes.forEach(n => { if (toolData[n.id]?.logo) logos[n.id] = toolData[n.id].logo; });

      const radius = d => {
        if (d.id === nodeId) return 30;
        if (logos[d.id]) return 22;
        return 13;
      };

      const svg = d3.select(svgEl);
      const defs = svg.append('defs');

      defs.append('marker')
        .attr('id', 'tg-arrow')
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 0).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-4L8,0L0,4Z').attr('fill', '#3a4a7a');

      nodes.filter(n => logos[n.id]).forEach(n => {
        defs.append('clipPath').attr('id', `tg-c-${n.id}`)
          .append('circle').attr('r', radius(n));
      });

      // Fix center node in the middle
      const center = nodes.find(n => n.id === nodeId);
      if (center) { center.fx = W / 2; center.fy = H / 2; }

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(105))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collide', d3.forceCollide(d => radius(d) + 26));

      const linkEl = svg.append('g')
        .selectAll('line').data(links).join('line')
        .attr('stroke', '#252e4a').attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#tg-arrow)');

      const nodeEl = svg.append('g')
        .selectAll('g').data(nodes).join('g')
        .style('cursor', d => toolData[d.id]?.url ? 'pointer' : 'default')
        .attr('role', d => toolData[d.id]?.url ? 'link' : null)
        .attr('aria-label', d => d.label);

      // Dashed halo for center node
      nodeEl.filter(d => d.id === nodeId)
        .append('circle')
        .attr('r', d => radius(d) + 6)
        .attr('fill', 'none')
        .attr('stroke', '#4a6ac8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 3');

      // Logo nodes
      nodeEl.filter(d => !!logos[d.id])
        .append('circle')
        .attr('r', d => radius(d))
        .attr('fill', '#fff')
        .attr('stroke', d => d.id === nodeId ? '#4a6ac8' : '#2e3a5a')
        .attr('stroke-width', d => d.id === nodeId ? 2 : 1.5);

      nodeEl.filter(d => !!logos[d.id])
        .append('image')
        .attr('href', d => logos[d.id])
        .attr('x', d => -radius(d)).attr('y', d => -radius(d))
        .attr('width', d => radius(d) * 2).attr('height', d => radius(d) * 2)
        .attr('clip-path', d => `url(#tg-c-${d.id})`)
        .style('pointer-events', 'none');

      // Plain nodes
      nodeEl.filter(d => !logos[d.id])
        .append('circle')
        .attr('r', d => radius(d))
        .attr('fill', d => d.id === nodeId ? '#18245a' : '#151c30')
        .attr('stroke', d => d.id === nodeId ? '#4a6ac8' : '#2e3a5a')
        .attr('stroke-width', d => d.id === nodeId ? 2 : 1.5);

      // Labels
      nodeEl.append('text')
        .text(d => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', d => radius(d) + 13)
        .attr('fill', d => d.id === nodeId ? '#b0c4ff' : '#50608a')
        .attr('font-size', d => d.id === nodeId ? '11px' : '9px')
        .attr('font-weight', d => d.id === nodeId ? '600' : 'normal')
        .attr('font-family', 'system-ui, sans-serif')
        .style('pointer-events', 'none');

      nodeEl.on('click', (e, d) => {
        const url = toolData[d.id]?.url;
        if (url) window.location.href = url;
      });

      // Edge endpoint adjusted to stop at node circumference
      const edgeEnd = (axis, target, source) => coord => {
        const dx = target.x - source.x, dy = target.y - source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return (axis === 'x' ? target.x : target.y) - ((axis === 'x' ? dx : dy) / len) * radius(target);
      };

      sim.on('tick', () => {
        linkEl
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => {
            const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            return d.target.x - (dx / len) * radius(d.target);
          })
          .attr('y2', d => {
            const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            return d.target.y - (dy / len) * radius(d.target);
          });
        nodeEl.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    }
  }

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  if (!customElements.get('tool-graph')) {
    customElements.define('tool-graph', ToolGraph);
  }
})();
