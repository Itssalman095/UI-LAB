(function(){
      // chart data: [month label, value] — starts at 0 so the line visibly
      // begins right at the axis origin
      const data = [
        { m: "Jan", v: 0,     v2: 0 },
        { m: "Feb", v: 4200,  v2: 3600 },
        { m: "Mar", v: 3700,  v2: 4300 },
        { m: "Apr", v: 9600,  v2: 8200 },
        { m: "May", v: 8400,  v2: 9800 },
        { m: "Jun", v: 14600, v2: 12900 },
        { m: "Jul", v: 20633, v2: 17400 },
      ];
     
      const svg = document.getElementById('chartSvg');
      const W = 420, H = 298;
      const padL = 6, padR = 6, padT = 90, padB = 10;
     
      // extra top padding (padT) keeps the line clear of the stat numbers now
      // sitting over the chart's top-left corner, while still climbing all the
      // way to the actual peak value near the top of the usable chart area.
      const maxV = Math.max(...data.map(d => Math.max(d.v, d.v2))) * 1.03;
      const minV = 0;
     
      function x(i){ return padL + (i / (data.length - 1)) * (W - padL - padR); }
      function y(v){ return H - padB - ((v - minV) / (maxV - minV)) * (H - padT - padB); }
     
      // Catmull-Rom → cubic Bezier: produces a naturally smooth, flowing curve
      // that still passes exactly through every data point (including the peak).
      // End segments use a reflected phantom point instead of clamping to the
      // same point, so the first/last segments curve like the interior ones
      // rather than flattening into a straight line.
      function buildSmoothPath(points){
        if(points.length < 2) return '';
        let d = `M ${points[0][0]} ${points[0][1]} `;
        for(let i = 0; i < points.length - 1; i++){
          const p1 = points[i];
          const p2 = points[i + 1];
          const p0 = points[i - 1] || [2*p1[0]-p2[0], 2*p1[1]-p2[1]];
          const p3 = points[i + 2] || [2*p2[0]-p1[0], 2*p2[1]-p1[1]];
     
          const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
          const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
          const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
          const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
     
          d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]} `;
        }
        return d.trim();
      }
     
      const mainPts = data.map((d,i) => [x(i), y(d.v)]);
      const dimPts  = data.map((d,i) => [x(i), y(d.v2)]);
     
      const mainPath = buildSmoothPath(mainPts);
      const dimPath  = buildSmoothPath(dimPts);
      const areaPath = mainPath + ` L ${mainPts[mainPts.length-1][0]} ${H-padB} L ${mainPts[0][0]} ${H-padB} Z`;
     
      document.getElementById('lineMain').setAttribute('d', mainPath);
      document.getElementById('lineDim').setAttribute('d', dimPath);
      document.getElementById('areaPath').setAttribute('d', areaPath);
     
      // gridlines (vertical, from each point straight down to the baseline —
      // not stretching above the point, so no tall marks over the peak)
      const gridG = document.getElementById('gridLines');
      data.forEach((d,i) => {
        const gx = x(i);
        const gy = y(d.v);
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', gx); line.setAttribute('x2', gx);
        line.setAttribute('y1', gy); line.setAttribute('y2', H - padB);
        gridG.appendChild(line);
      });
     
      // animate line draw-in — both lines draw from Jan (0) to the last point
      const LINE_DRAW_MS = 4000;
      [document.getElementById('lineMain'), document.getElementById('lineDim')].forEach(path => {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        path.style.transition = 'none';
        path.getBoundingClientRect(); // force reflow — lock in the hidden state
     
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // smooth eased draw — the dot timing below is computed by inverting
            // this exact same easing curve, so it stays smooth AND in sync.
            path.style.transition = `stroke-dashoffset ${LINE_DRAW_MS}ms cubic-bezier(.2,.8,.2,1)`;
            path.style.strokeDashoffset = '0';
          });
        });
      });
     
      // dots + interactivity
      const dotsG = document.getElementById('dots');
      const tooltip = document.getElementById('tooltip');
      const ttMonth = document.getElementById('ttMonth');
      const ttVal = document.getElementById('ttVal');
      const wrap = document.getElementById('chartWrap');
     
      const lineMainEl = document.getElementById('lineMain');
      const mainLineLen = lineMainEl.getTotalLength();
     
      // find how far along the actual curve (not just by index) the line has
      // to travel before it visually reaches a given x — the curve isn't evenly
      // spaced in arc-length, so this keeps each dot's appearance locked to the
      // real drawing position of the line instead of an approximate delay.
      function lengthAtX(path, totalLen, targetX){
        let start = 0, end = totalLen;
        for(let i = 0; i < 22; i++){
          const mid = (start + end) / 2;
          const pt = path.getPointAtLength(mid);
          if(pt.x < targetX) start = mid; else end = mid;
        }
        return (start + end) / 2;
      }
     
      // matches CSS cubic-bezier(.2,.8,.2,1) exactly — given a target progress
      // (0-1, how far along the line's length we want), returns the elapsed
      // time fraction (0-1) at which the eased animation actually reaches it.
      function bezierComponent(t, c1, c2){
        const mt = 1 - t;
        return 3*mt*mt*t*c1 + 3*mt*t*t*c2 + t*t*t;
      }
      function easedTimeForProgress(targetProgress){
        let lo = 0, hi = 1;
        for(let i = 0; i < 24; i++){
          const mid = (lo + hi) / 2;
          const y = bezierComponent(mid, 0.8, 1); // Y control points of cubic-bezier(.2,.8,.2,1)
          if(y < targetProgress) lo = mid; else hi = mid;
        }
        const t = (lo + hi) / 2;
        return bezierComponent(t, 0.2, 0.2); // X control points → elapsed time fraction
      }
     
      data.forEach((d,i) => {
        const [cx, cy] = mainPts[i];
     
        const hit = document.createElementNS('http://www.w3.org/2000/svg','circle');
        hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', 14);
        hit.setAttribute('fill', 'transparent');
        hit.style.cursor = 'pointer';
     
        const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
        dot.setAttribute('r', i === data.length-1 ? 5.5 : 4);
        dot.setAttribute('fill', '#ffffff');
        dot.setAttribute('filter', 'url(#glow)');
        dot.style.opacity = '0';
     
        const distAlongLine = lengthAtX(lineMainEl, mainLineLen, cx);
        const targetProgress = distAlongLine / mainLineLen;
        const pointDelay = easedTimeForProgress(targetProgress) * LINE_DRAW_MS;
        // fade the dot in fast, and start the fade slightly BEFORE the line
        // arrives, so it's fully opaque right as the line reaches it instead
        // of only starting to appear at that moment (which reads as lagging).
        const FADE_MS = 120;
        const fadeStart = Math.max(0, pointDelay - FADE_MS);
     
        dot.style.transition = `opacity ${FADE_MS}ms linear ${fadeStart}ms`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { dot.style.opacity = '1'; });
        });
     
        function showTip(){
          ttMonth.textContent = d.m;
          ttVal.textContent = d.v.toLocaleString('en-US');
          const pct = ((cx / W) * 100);
          const pctY = ((cy / H) * 100);
          tooltip.style.left = pct + '%';
          tooltip.style.top = pctY + '%';
          tooltip.style.opacity = '1';
          dot.setAttribute('r', 7);
        }
        function hideTip(){
          tooltip.style.opacity = '0';
          dot.setAttribute('r', i === data.length-1 ? 5.5 : 4);
        }
     
        hit.addEventListener('mouseenter', showTip);
        hit.addEventListener('mouseleave', hideTip);
        hit.addEventListener('touchstart', (e)=>{ e.preventDefault(); showTip(); }, {passive:false});
        hit.addEventListener('touchend', hideTip);
     
        dotsG.appendChild(dot);
        dotsG.appendChild(hit);
      });
     
      // build the reflection by cloning the card
      const original = document.getElementById('mainCard');
      const reflectionHost = document.getElementById('reflection');
      const clone = original.cloneNode(true);
      clone.removeAttribute('id');
      reflectionHost.appendChild(clone);
    })();
