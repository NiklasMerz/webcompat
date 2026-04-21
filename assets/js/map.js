(function () {
  const { nodes, edges } = graphData;
  const links = edges.map(e => ({ source: e.source, target: e.target }));

  // Bidirectional adjacency for keyboard nav and highlight
  const adjacency = {};
  nodes.forEach(n => { adjacency[n.id] = []; });
  edges.forEach(e => {
    adjacency[e.source].push(e.target);
    adjacency[e.target].push(e.source);
  });

  const ariaLabel = d => {
    const neighbors = adjacency[d.id]
      .map(id => nodes.find(n => n.id === id)?.label ?? id)
      .join(', ');
    return neighbors ? `${d.label}. Connected to: ${neighbors}` : d.label;
  };

  const W = window.innerWidth;
  const H = window.innerHeight;

  const svg = d3.select('#map')
    .attr('viewBox', `0 0 ${W} ${H}`);

  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -4 8 8')
    .attr('refX', 0).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4Z')
    .attr('fill', '#4a5580');

  const nodeRadius = d => d.category === 'toolchain' ? 22 : 10;

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(160))
    .force('charge', d3.forceManyBody().strength(-600))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collide', d3.forceCollide(d => nodeRadius(d) + 28));

  const linkEl = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#2e3650')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrow)');

  const nodeEl = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node-group')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', ariaLabel)
    .style('cursor', 'grab')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  // Focus ring (hidden by default, shown via CSS :focus)
  nodeEl.append('circle')
    .attr('class', 'focus-ring')
    .attr('r', d => nodeRadius(d) + 5)
    .attr('fill', 'none')
    .attr('stroke', '#60a8ff')
    .attr('stroke-width', 2);

  nodeEl.filter(d => d.category === 'toolchain')
    .append('circle').attr('r', 22)
    .attr('fill', '#2a3a6e').attr('stroke', '#5a7adc').attr('stroke-width', 1.5);

  nodeEl.filter(d => !d.category)
    .append('circle').attr('r', 10)
    .attr('fill', '#1e2538').attr('stroke', '#3a4a7a').attr('stroke-width', 1.5);

  nodeEl.append('text')
    .text(d => d.label)
    .attr('text-anchor', 'middle')
    .attr('y', d => nodeRadius(d) + 14)
    // Both pass WCAG AA on #0f1117: category ~10:1, regular ~5.5:1
    .attr('fill', d => d.category === 'toolchain' ? '#a0b8f0' : '#8090c0')
    .attr('font-size', d => d.category === 'toolchain' ? '12px' : '10px')
    .style('pointer-events', 'none');

  // Highlight a node and its immediate neighbors; dim everything else
  function highlight(d) {
    const connected = new Set([d.id, ...adjacency[d.id]]);
    nodeEl.style('opacity', n => connected.has(n.id) ? 1 : 0.15);
    linkEl.style('opacity', l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return s === d.id || t === d.id ? 1 : 0.05;
    });
  }

  function clearHighlight() {
    nodeEl.style('opacity', 1);
    linkEl.style('opacity', 1);
  }

  const tooltip = d3.select('body').append('div').attr('class', 'node-tooltip').style('display', 'none');

  nodeEl
    .on('mouseenter', (e, d) => { highlight(d); tooltip.style('display', 'block').text(d.label); })
    .on('mousemove', e => tooltip.style('left', (e.clientX + 14) + 'px').style('top', (e.clientY - 28) + 'px'))
    .on('mouseleave', () => { clearHighlight(); tooltip.style('display', 'none'); })
    .on('focus', (e, d) => highlight(d))
    .on('blur', () => clearHighlight())
    .on('keydown', (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        highlight(d);
      } else if (e.key === 'Escape') {
        clearHighlight();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusNeighbor(d, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusNeighbor(d, -1);
      }
    });

  // Move keyboard focus to a neighbor of d
  function focusNeighbor(d, dir) {
    const neighbors = adjacency[d.id];
    if (!neighbors.length) return;
    const targetId = neighbors[dir === 1 ? 0 : neighbors.length - 1];
    nodeEl.filter(n => n.id === targetId).node()?.focus();
  }

  sim.on('tick', () => {
    linkEl
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => {
        const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return d.target.x - (dx / len) * nodeRadius(d.target);
      })
      .attr('y2', d => {
        const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return d.target.y - (dy / len) * nodeRadius(d.target);
      });

    nodeEl.attr('transform', d => {
      const pad = nodeRadius(d) + 16;
      return `translate(${Math.max(pad, Math.min(W - pad, d.x))},${Math.max(pad, Math.min(H - pad - 16, d.y))})`;
    });
  });
})();
