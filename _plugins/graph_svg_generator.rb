require 'fileutils'

# Generates a static SVG connection graph for each tool after Jekyll writes
# its output. SVGs land in _site/assets/img/graphs/{nodeId}.svg and are
# also available at /assets/img/graphs/{nodeId}.svg on the live site.

Jekyll::Hooks.register :site, :post_write do |site|
  GraphSvgGenerator.run(site)
end

module GraphSvgGenerator
  CENTER_R   = 28
  NEIGHBOR_R = 13
  FOOT_H     = 28
  HPAD       = 20  # horizontal padding beyond the outermost node (for label text)
  VPAD       = 30  # vertical padding beyond the outermost node (for label text)

  def self.run(site)
    graph = site.data['graph']
    return unless graph

    nodes    = graph['nodes'] || []
    edges    = graph['edges'] || []
    node_map = nodes.each_with_object({}) { |n, h| h[n['id']] = n }

    outgoing = Hash.new { |h, k| h[k] = [] }
    incoming = Hash.new { |h, k| h[k] = [] }
    edges.each do |e|
      outgoing[e['source']] << e['target']
      incoming[e['target']] << e['source']
    end

    dest_dir = File.join(site.dest, 'assets', 'img', 'graphs')
    FileUtils.mkdir_p(dest_dir)

    count = 0
    site.collections['tools'].docs.each do |doc|
      node_id = doc.data['node_id']
      next unless node_id

      out       = outgoing[node_id]
      inc       = incoming[node_id]
      neighbors = (inc + out).uniq

      svg = build_svg(node_id, doc.data['title'].to_s, neighbors, out, inc, node_map)
      File.write(File.join(dest_dir, "#{node_id}.svg"), svg)
      count += 1
    end

    Jekyll.logger.info 'GraphSVG:', "Generated #{count} connection graphs → assets/img/graphs/"
  end

  def self.build_svg(node_id, title, neighbors, out, inc, node_map)
    n       = neighbors.length
    orbit_r = [[85, 70 + n * 7].max, 130].min
    # Dimensions derived from orbit + explicit padding so labels never clip.
    # HPAD/VPAD account for label text that extends beyond the node circle.
    w  = n.zero? ? 200 : 2 * (orbit_r + NEIGHBOR_R + HPAD) + 60
    h  = n.zero? ? 120 : 2 * (orbit_r + NEIGHBOR_R + VPAD) + FOOT_H
    cx = w / 2.0
    cy = (h - FOOT_H) / 2.0

    positions = neighbors.each_with_index.map do |id, i|
      angle = (2 * Math::PI * i / n) - Math::PI / 2
      { id: id, x: cx + orbit_r * Math.cos(angle), y: cy + orbit_r * Math.sin(angle) }
    end

    edges_markup = positions.map do |p|
      dx  = p[:x] - cx
      dy  = p[:y] - cy
      len = Math.sqrt(dx * dx + dy * dy)
      ux  = dx / len
      uy  = dy / len

      if out.include?(p[:id])
        x1 = (cx + ux * (CENTER_R + 2)).round(1)
        y1 = (cy + uy * (CENTER_R + 2)).round(1)
        x2 = (p[:x] - ux * (NEIGHBOR_R + 2)).round(1)
        y2 = (p[:y] - uy * (NEIGHBOR_R + 2)).round(1)
        %(<line x1="#{x1}" y1="#{y1}" x2="#{x2}" y2="#{y2}" class="eo" marker-end="url(#arr)"/>)
      else
        x1 = (p[:x] - ux * (NEIGHBOR_R + 2)).round(1)
        y1 = (p[:y] - uy * (NEIGHBOR_R + 2)).round(1)
        x2 = (cx + ux * (CENTER_R + 2)).round(1)
        y2 = (cy + uy * (CENTER_R + 2)).round(1)
        %(<line x1="#{x1}" y1="#{y1}" x2="#{x2}" y2="#{y2}" class="ei" marker-end="url(#arr)"/>)
      end
    end.join("\n    ")

    nodes_markup = positions.map do |p|
      label = trunc(node_map[p[:id]]&.dig('label') || p[:id], 18)
      # Place label above nodes in the upper half, below in the lower half.
      # Use explicit y offsets rather than dominant-baseline for portability.
      above = p[:y] < cy - 5
      ly    = above ? (p[:y] - NEIGHBOR_R - 3).round(1) : (p[:y] + NEIGHBOR_R + 9).round(1)
      dy    = above ? '-0.2em' : '0.8em'
      %(
    <circle cx="#{p[:x].round(1)}" cy="#{p[:y].round(1)}" r="#{NEIGHBOR_R}" class="nn"/>
    <text x="#{p[:x].round(1)}" y="#{ly}" dy="#{dy}" class="ls">#{esc(label)}</text>)
    end.join

    foot_y = h - FOOT_H

    <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" width="#{w}" height="#{h}" viewBox="0 0 #{w} #{h}">
        <style>
          :root{--bg:#0d1020;--bd:#1e2540;--nc:#18245a;--ns:#4a6ac8;--nb:#151c30;--sb:#2e3a5a;--e:#2a3858;--lc:#b0c4ff;--ls:#8090c0;--ft:#303858;--fl:#5a7adc}
          @media(prefers-color-scheme:light){:root{--bg:#f2f4fb;--bd:#c8d0e8;--nc:#dde5ff;--ns:#4a6ac8;--nb:#e8ebf5;--sb:#8090b8;--e:#8090b8;--lc:#1a2a7a;--ls:#405090;--ft:#d0d8f0;--fl:#3a5aaa}}
          .bg{fill:var(--bg)}.nc{fill:var(--nc);stroke:var(--ns);stroke-width:2}.halo{fill:none;stroke:var(--ns);stroke-width:1.5;stroke-dasharray:4 3}.nn{fill:var(--nb);stroke:var(--sb);stroke-width:1.5}.eo,.ei{stroke:var(--e);stroke-width:1.5}.lc{fill:var(--lc);font:600 11px system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}.ls{fill:var(--ls);font:9px system-ui,sans-serif;text-anchor:middle}.foot{fill:var(--ft)}.fl{fill:var(--fl);font:10px system-ui,sans-serif;text-anchor:middle}
        </style>
        <defs>
          <marker id="arr" viewBox="0 -4 8 8" refX="0" refY="0" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,-4L8,0L0,4Z" fill="var(--e)"/>
          </marker>
          <clipPath id="clip"><rect width="#{w}" height="#{h}" rx="8"/></clipPath>
        </defs>
        <rect width="#{w}" height="#{h}" rx="8" class="bg" stroke="var(--bd)" stroke-width="1"/>
        <g clip-path="url(#clip)">
          #{edges_markup}
          <circle cx="#{cx.round(1)}" cy="#{cy.round(1)}" r="#{CENTER_R + 6}" class="halo"/>
          <circle cx="#{cx.round(1)}" cy="#{cy.round(1)}" r="#{CENTER_R}" class="nc"/>
          <text x="#{cx.round(1)}" y="#{cy.round(1)}" class="lc">#{esc(trunc(title, 22))}</text>
          #{nodes_markup}
          <rect y="#{foot_y}" width="#{w}" height="#{FOOT_H}" class="foot"/>
          <text x="#{(w / 2.0).round(1)}" y="#{(foot_y + FOOT_H / 2.0).round(1)}" class="fl" dominant-baseline="central">webcompat.dev</text>
        </g>
      </svg>
    SVG
  end

  def self.trunc(str, max)
    str.length > max ? "#{str[0, max - 1]}…" : str
  end

  def self.esc(str)
    str.to_s.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;').gsub('"', '&quot;')
  end
end
