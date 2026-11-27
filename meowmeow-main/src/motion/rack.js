import THREE from '../vendor/three.r128.min.cjs';

import {PRODUCTS} from '../shop/store';

const profiles = [
  {blade:[[16,43,118],[100,38,124],[240,29,127],[350,24,127],[500,18,130],[610,13,132],[730,8,135],[794,71,71]], tail:[[16,45,118],[105,69,141],[200,107,169],[258,129,190],[410,186,242],[560,238,299],[578,244,291],[596,282,282]], silk:"#182530"},
  {blade:[[16,31,104],[100,28,106],[240,24,108],[350,20,109],[510,15,111],[635,11,114],[734,9,116],[789,63,63]], tail:[[16,30,104],[112,55,106],[220,87,138],[330,118,172],[470,162,215],[644,215,272],[662,220,265],[682,255,255]], silk:"#4d5b2b"},
  {blade:[[16,43,119],[100,38,125],[240,29,126],[350,24,126],[510,17,129],[635,11,131],[730,7,132],[796,71,71]], tail:[[16,45,119],[105,71,141],[200,109,169],[259,130,190],[410,188,244],[561,239,301],[586,247,293],[605,283,283]], silk:"#262523"},
  {blade:[[16,43,117],[100,39,122],[240,30,124],[350,24,125],[510,17,128],[635,11,131],[733,8,133],[795,72,72]], tail:[[16,45,117],[105,71,141],[200,109,170],[259,130,189],[410,187,241],[560,239,298],[579,245,290],[597,282,282]], silk:"#851e27"},
  {blade:[[16,29,105],[88,26,107],[237,22,108],[342,19,109],[512,15,112],[618,12,115],[744,8,118],[803,64,64]], tail:[[16,29,105],[104,55,108],[199,72,130],[334,116,171],[467,158,213],[656,215,275],[677,222,265],[696,254,254]], silk:"#e05d27"},
  {blade:[[16,43,117],[102,37,120],[248,30,124],[354,24,127],[487,19,129],[618,13,131],[741,8,133],[803,70,70]], tail:[[16,44,117],[88,61,134],[181,87,161],[268,128,189],[397,176,234],[566,235,298],[590,248,288],[605,279,279]], silk:"#9f5776"},
];
const atlasSize = 2048;
const columns = 9;
const creaseAcross = Float32Array.from({length: columns}, (_, c) => {
  const u = c / (columns - 1);
  return Math.sin(u * Math.PI * 2.5) + .3 * Math.sin(u * Math.PI * 6);
});
const rodY = 20, rodRadius = 11, clothRadius = 12.2;
const step = 1 / 90, iterations = 5, maxSubsteps = 12;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const mix = (from, to, weight) => from + (to - from) * weight;

function sampleProfile(profile, y) {
  const index = profile.findIndex(point => point[0] > y);
  if (index < 0) return profile.at(-1).slice(1);
  if (index === 0) return profile[0].slice(1);
  const [y0, left0, right0] = profile[index - 1];
  const [y1, left1, right1] = profile[index];
  const weight = (y - y0) / (y1 - y0);
  return [mix(left0, left1, weight), mix(right0, right1, weight)];
}

function sampleRows(profile, count) {
  const end = profile.at(-1)[0];
  const corner = profile.at(-2)[0];
  const anchors = [25, 40, corner, profile.at(-3)[0]];
  const rows = Array.from({length: count}, (_, i) => mix(16, end, (i + 1) / count))
    .filter(y => anchors.every(anchor => Math.abs(y - anchor) > 7));
  rows.push(...anchors);
  return [...new Set(rows)].sort((a, b) => a - b);
}

function boundsFor(profile) {
  const points = profile.blade.concat(profile.tail);
  return [Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[2]))];
}

// Compiled from cloth-links.wat. The JavaScript solver remains available without WebAssembly.
const constraintKernel = (() => {
  try {
    const bytes = Uint8Array.from(atob('AGFzbQEAAAABBgFgAn9/AAMCAQAFAwEAIAcSAgZtZW1vcnkCAAVzb2x2ZQAACo8CAYwCAgJ/B3wDQCAAKAIAIQIgACgCBCEDIAMqAgC7IAIqAgC7oSEEIAMqAgS7IAIqAgS7oSEFIAMqAgi7IAIqAgi7oSEGIAQgBKIgBSAFoqAgBiAGoqCfIQcgB0QtQxzr4jYaP2YEQEQAAAAAAADwPyAAKgIIuyAHo6EhCCAIIAAqAgy7oiEJIAggACoCELuiIQogAiACKgIAuyAEIAmioLY4AgAgAyADKgIAuyAEIAqiobY4AgAgAiACKgIEuyAFIAmioLY4AgQgAyADKgIEuyAFIAqiobY4AgQgAiACKgIIuyAGIAmioLY4AgggAyADKgIIuyAGIAqiobY4AggLIABBFGohACAAIAFJDQALCw=='), char => char.charCodeAt(0));
    return new WebAssembly.Instance(new WebAssembly.Module(bytes)).exports;
  } catch {
    return null;
  }
})();

function prepareConstraintPass(index, points, links) {
  if (!constraintKernel) return null;
  const buffer = constraintKernel.memory.buffer;
  const alignment = Float32Array.BYTES_PER_ELEMENT;
  const stride = Math.floor(buffer.byteLength / profiles.length / alignment) * alignment;
  if (points.byteLength + links.byteLength > stride) return null;
  const base = stride * index, start = base + points.byteLength;
  const scratch = new Float32Array(buffer, base, points.length);
  const records = new Float32Array(buffer, start, links.length);
  records.set(links);
  const addresses = new Uint32Array(buffer, start, links.length);
  for (let i = 0; i < links.length; i += 5) {
    addresses[i] = base + links[i] * 4;
    addresses[i + 1] = base + links[i + 1] * 4;
  }
  return () => {
    scratch.set(points);
    constraintKernel.solve(start, start + links.byteLength);
    points.set(scratch);
  };
}

class SilkStrip {
  constructor(profile, index, scale, slot) {
    this.scale = scale;
    this.origin = (profile.blade[0][1] + profile.blade[0][2]) / 2;
    this.rows = [];
    this.blade = [];
    this.tail = [];
    const rearRows = sampleRows(profile.tail, 22);
    const frontRows = sampleRows(profile.blade, 38);
    rearRows.reverse().forEach(y => this.addHangingRow(profile.tail, y, false));
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const [left, right] = profile.blade[0].slice(1);
      this.rows.push({
        left: (left - this.origin) * scale, right: (right - this.origin) * scale,
        y: rodY - Math.sin(t * Math.PI) * clothRadius,
        z: -Math.cos(t * Math.PI) * clothRadius,
        angle: t * Math.PI, uv: 800 + t * 63, pinned: true
      });
    }
    frontRows.forEach(y => this.addHangingRow(profile.blade, y, true));

    const count = this.rows.length * columns;
    this.rest = new Float32Array(count * 3);
    this.points = new Float32Array(count * 3);
    this.previous = new Float32Array(count * 3);
    this.invMass = new Float32Array(count);
    this.uv = new Float32Array(count * 2);
    const indices = [];
    this.rows.forEach((row, r) => {
      row.start = r * columns;
      for (let c = 0; c < columns; c++) {
        const i = row.start + c, u = c / (columns - 1);
        this.rest[i * 3] = mix(row.left, row.right, u);
        const crown = Math.sin(Math.PI * u);
        const radius = clothRadius + crown * (.55 + .55 * Math.cos(row.angle || 0) ** 2);
        this.rest[i * 3 + 1] = row.pinned ? rodY - Math.sin(row.angle) * radius : row.y;
        // The lining holds a shallow crosswise curve outside the fold.
        this.rest[i * 3 + 2] = row.pinned ? -Math.cos(row.angle) * radius :
          row.z + crown * (row.front ? 2.1 : 1.2) * row.fullness;
        this.invMass[i] = row.pinned ? 0 : row.front ? .68 : 1.15;
        this.uv[i * 2] = (4.5 + 248 * index + 159 * u) / atlasSize;
        this.uv[i * 2 + 1] = 1 - (row.uv + .5) / atlasSize;
        if (r && c) {
          const a = i - columns - 1, b = i - columns;
          indices.push(a, i - 1, b, b, i - 1, i);
        }
      }
    });
    for (const tail of this.tail) {
      tail.opposite = this.blade.reduce((best, row) =>
        Math.abs(row.y - tail.y) < Math.abs(best.y - tail.y) ? row : best);
    }
    this.gripRow = this.blade.reduce((best, row) => row.pull > best.pull ? row : best);
    this.layerShade = new Float32Array(count);
    this.indices = indices;
    this.links = this.buildLinks();
    const compiledPass = prepareConstraintPass(index, this.points, this.links);
    if (compiledPass) this.solveLinks = compiledPass;
    this.reset(slot);
  }

  addHangingRow(profile, y, front) {
    const [left, right] = sampleProfile(profile, y);
    const length = profile.at(-1)[0] - 16;
    const t = (y - 16) / length;
    const fullness = Math.min(1, (right - left) / 34);
    const f = (y - 16) * this.scale;
    const row = {
      left: (left - this.origin) * this.scale,
      right: (right - this.origin) * this.scale + Math.max(0, .6 - (right - left) * this.scale),
      y: rodY + f,
      z: front ? clothRadius + 1.4 * Math.sin(t * Math.PI) :
        -clothRadius + 22 * Math.pow(t, 1.6),
      front, fullness,
      exitBend: front ? 0 : Math.exp(-t * 4.8),
      depthStiffness: front ? 12 - 8 * clamp((t - .73) / .22, 0, 1) : 26,
      uv: front ? 864 + y - 16 : 800 - y,
      pull: front && Math.abs(t - .665) < .09 ? Math.exp(-Math.pow((t - .665) / .055, 2)) : 0
    };
    this.rows.push(row);
    (front ? this.blade : this.tail).push(row);
  }

  buildLinks() {
    const links = [];
    const {rest, invMass} = this;
    const link = (a, b, stiffness) => {
      if (a < 0 || b >= invMass.length || invMass[a] + invMass[b] === 0) return;
      const x = rest[3 * a] - rest[3 * b], y = rest[3 * a + 1] - rest[3 * b + 1];
      const length = Math.hypot(x, y, rest[3 * a + 2] - rest[3 * b + 2]);
      const factor = stiffness / (invMass[a] + invMass[b]);
      links.push(3 * a, 3 * b, length, factor * invMass[a], factor * invMass[b]);
    };
    for (let r = 0; r < this.rows.length; r++) {
      for (let c = 0; c < columns; c++) {
        const a = r * columns + c;
        if (c + 1 < columns) link(a, a + 1, .94);
        if (c + 2 < columns) link(a, a + 2, .36);
        link(a, a + columns, .96);
        const blade = this.rows[r].front;
        link(a, a + columns * 2, blade ? .56 : .47);
        link(a, a + columns * 4, blade ? .37 : .31);
        link(a, a + columns * 7, blade ? .11 : .24);
        if (c > 0) link(a, a + columns - 1, .54);
        if (c + 1 < columns) link(a, a + columns + 1, .54);
      }
    }
    return new Float32Array(links);
  }

  reset(slot) {
    for (let i = 0; i < this.points.length; i += 3) {
      this.points[i] = this.rest[i] + slot;
      this.points[i + 1] = this.rest[i + 1];
      this.points[i + 2] = this.rest[i + 2];
    }
    this.previous.set(this.points);
  }

  rebase(before, oldSlot, slot) {
    const ratio = this.scale / before.scale;
    for (let i = 0; i < this.points.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const j = i + axis, horizontal = axis === 0;
        const from = before.rest[j] + (horizontal ? oldSlot : 0);
        const to = this.rest[j] + (horizontal ? slot : 0);
        this.points[j] = to + ratio * (before.points[j] - from);
        this.previous[j] = to + ratio * (before.previous[j] - from);
      }
    }
  }

  integrate(tie) {
    const {points: p, previous, rest} = this;
    const dt2 = step * step;
    const drag = tie.pressure;
    // Small elastic roll around the rail transmits blade tension to the rear tangent.
    const neck = 3 * (this.blade[2].start + 4) + 2;
    const grip = 3 * (this.gripRow.start + 4) + 2;
    const torque = (p[neck] - rest[neck]) / 90 + (p[grip] - rest[grip]) / (260 * this.scale);
    this.roll = mix(this.roll || 0, clamp(torque, -.17, .17), .055);
    this.rows.forEach(row => {
      const relativeY = (row.y - tie.contactY) / (this.scale * 90);
      const pressure = drag > .001 ? Math.exp(-relativeY * relativeY) * drag : 0;
      for (let c = 0; c < columns; c++) {
        const i = 3 * (row.start + c);
        const x = p[i], y = p[i + 1], z = p[i + 2];
        if (row.pinned) {
          p[i] = rest[i] + tie.slot;
          const radius = Math.hypot(rest[i + 1] - rodY, rest[i + 2]);
          const angle = row.angle + this.roll * (.8 + .4 * c / (columns - 1));
          p[i + 1] = rodY - Math.sin(angle) * radius;
          p[i + 2] = -Math.cos(angle) * radius;
        } else {
          const center = c / (columns - 1);
          const side = Math.max(0, 1 - (tie.contactSide > 0 ? 1 - center : center) * 2.3);
          const crease = creaseAcross[c] * side * pressure;
          // The lining carries a bending moment beyond the rear tangent.
          const rearBend = this.roll * row.exitBend * (center - .18) * 155 * this.scale;
          const damping = row.front ? .965 : .939;

          p[i] += (x - previous[i]) * damping +
            dt2 * ((rest[i] + tie.slot - x) * (row.front ? 12 : 41));
          p[i + 1] += (y - previous[i + 1]) * damping +
            dt2 * (row.front ? 760 : 510);
          p[i + 2] += (z - previous[i + 2]) * (row.front ? .970 : .939) + dt2 *
            (rest[i + 2] + rearBend + crease * (row.front ? 1 : -1) - z) * row.depthStiffness;
        }
        previous[i] = x;
        previous[i + 1] = y;
        previous[i + 2] = z;
      }
    });
  }

  solvePinch(tie) {
    if (tie.pull < .001) return;
    const center = .5 + tie.wrist * .19;
    const scale = this.scale;
    // Compliant position targets on a compact elliptical patch of the lining.
    for (const row of this.blade) {
      if (!row.pull) continue;
      for (let c = 1; c < columns - 1; c++) {
        const across = c / (columns - 1) - center;
        const weight = row.pull * Math.exp(-((across / .24) ** 2));
        const strength = weight * tie.pull * .016;
        const i = 3 * (row.start + c);
        const p = this.points, r = this.rest;
        p[i] += (tie.slot + r[i] + tie.wrist * 10 * scale - p[i]) * strength;
        p[i + 1] += (r[i + 1] - scale * 12 - p[i + 1]) * strength;
        p[i + 2] += (r[i + 2] + scale * (55 + across * tie.wrist * 19) - p[i + 2]) * strength;
      }
    }
  }

  solveLinks() {
    const {points: p, links} = this;
    for (let i = 0; i < links.length; i += 5) {
      const a = links[i] | 0, b = links[i + 1] | 0;
      const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < .0001) continue;
      const error = 1 - links[i + 2] / length;
      const wa = error * links[i + 3], wb = error * links[i + 4];
      p[a] += dx * wa; p[a + 1] += dy * wa; p[a + 2] += dz * wa;
      p[b] -= dx * wb; p[b + 1] -= dy * wb; p[b + 2] -= dz * wb;
    }
  }

  solveLayers(shading = false) {
    const p = this.points;
    for (const row of this.tail) {
      const blade = row.opposite;
      const left = 3 * blade.start, right = left + 3 * (columns - 1);
      const span = Math.max(1, p[right] - p[left]);
      for (let c = 0; c < columns; c++) {
        const vertex = row.start + c, i = 3 * vertex;
        const u = clamp((p[i] - p[left]) / span, 0, 1) * (columns - 1);
        const segment = Math.min(columns - 2, Math.floor(u));
        const a = left + 3 * segment;
        const gap = mix(p[a + 2], p[a + 5], u - segment) - p[i + 2];
        const near = Math.abs(p[i + 1] - p[a + 1]) < 22;
        if (shading) {
          const projected = p[i] - Math.max(0, gap) * .25;
          const inside = Math.min(projected - p[left], p[right] - projected);
          this.layerShade[vertex] = near ? clamp(1 + inside / 7, 0, 1) * Math.exp(-Math.abs(gap) / 39) : 0;
        } else if (near && gap < 2.6 && p[i] > p[left] && p[i] < p[right]) {
          p[i + 2] -= (2.6 - gap) * .68;
          p[a + 2] += (2.6 - gap) * .16;
        }
      }
    }
  }

  solveRod() {
    const {points: p, invMass} = this;
    this.rows.forEach(row => {
      if (row.pinned || row.y > rodY + 55) return;
      for (let c = 0; c < columns; c++) {
        const j = row.start + c, i = 3 * j;
        if (!invMass[j]) continue;
        const y = p[i + 1] - rodY;
        const z = p[i + 2];
        const distance = Math.hypot(y, z);
        if (distance < clothRadius) {
          const sign = row.front ? 1 : -1;
          p[i + 2] = sign * Math.sqrt(Math.max(0, clothRadius * clothRadius - y * y));
        }
        // The two sides of the fold leave opposite faces of the cylinder.
        if (y < 38) p[i + 2] = row.front ? Math.max(2, p[i + 2]) : Math.min(-2, p[i + 2]);
      }
    });
  }

  motion() {
    let distance = 0;
    for (let i = 0; i < this.points.length; i++) {
      distance = Math.max(distance, Math.abs(this.points[i] - this.previous[i]));
    }
    return distance;
  }
}

function contactPairs(left, right) {
  return left.tail.filter(row => row.y > rodY + 100).map(row => {
    const other = right.blade.reduce((nearest, next) =>
      Math.abs(next.y - row.y) < Math.abs(nearest.y - row.y) ? next : nearest);
    return [(row.start + columns - 1) * 3, other.start * 3, row.y];
  });
}

function collide(left, right, pairs, report) {
  const a = left.cloth.points, b = right.cloth.points;
  let pressure = 0, y = 0;
  for (const [i, j, rowY] of pairs) {
    const dy = Math.abs(a[i + 1] - b[j + 1]);
    const depth = b[j + 2] - a[i + 2];
    // The broad phase lets nearby edges slide over one another in depth.
    if (dy > 24 || Math.abs(depth) > 19) continue;
    const overlap = a[i] - b[j] + 7.5;
    if (overlap <= 0) continue;
    const amount = Math.min(overlap, 20) * (1 - dy / 30);
    const stiffness = clamp((22 - Math.abs(depth)) / 15, .18, 1);
    a[i] -= amount * .25 * stiffness;
    b[j] += amount * .18 * stiffness;
    a[i + 2] -= amount * .105 * stiffness;
    b[j + 2] += amount * .07 * stiffness;
    if (amount > pressure) {pressure = amount; y = rowY}
  }
  if (report && pressure > 0) {
    left.load += pressure;
    right.load -= pressure;
    if (pressure > left.compression) {
      left.compression = pressure; left.contactY = y; left.contactSide = 1;
    }
    if (pressure > right.compression) {
      right.compression = pressure; right.contactY = y; right.contactSide = -1;
    }
  }
}

const clothVertex = `
attribute vec3 crossThread;
attribute float occlusion;
varying vec3 weft;
varying float overlapShade;
varying vec2 silkUV;
varying vec3 silkNormal;
varying vec3 silkPosition;

void main() {
  overlapShade = occlusion;
  weft = crossThread;
  silkUV = uv;
  silkNormal = normalize(normal);
  silkPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const clothFragment = `
uniform sampler2D atlas;
varying vec3 weft;
varying float overlapShade;
varying vec2 silkUV;
varying vec3 silkNormal;
varying vec3 silkPosition;

void main() {
  vec3 n = normalize(silkNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 light = normalize(vec3(-0.38, 0.66, 0.82));
  vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
  float diffuse = max(0.0, dot(n, light));
  vec3 tangent = normalize(weft - n * dot(weft, n));
  vec3 warp = normalize(cross(n, tangent));
  float widthAngle = dot(halfVector, tangent);
  float lengthAngle = dot(halfVector, warp);
  float sheen = exp(-11.0 * widthAngle * widthAngle - 3.4 * lengthAngle * lengthAngle)
              * smoothstep(0.0, 0.75, dot(n, halfVector));
  float weave = 1.0 + (sin(silkUV.x * 14800.0) * sin(silkUV.y * 20100.0)) * 0.003;
  // Each tie occupies 159 of every 248 atlas pixels, starting 4.5 pixels in.
  float across = mod(silkUV.x * 2048.0 - 4.5, 248.0);
  float edge = smoothstep(0.0, 4.0, min(across, 159.0 - across));
  float shoulder = 1.0 - smoothstep(0.0, 15.0, abs(silkPosition.y + 22.0));
  vec3 color = texture2D(atlas, silkUV).rgb;
  float sourceRow = (1.0 - silkUV.y) * 2048.0;
  float plainSilk = 1.0 - smoothstep(1210.0, 1260.0, sourceRow);
  color *= 1.0 - plainSilk * smoothstep(.32, .74, max(max(color.r, color.g), color.b)) * .075;
  color *= 1.0 - .24 * overlapShade;
  color *= (0.6 + diffuse * 0.5) * (0.92 + 0.08 * edge) * weave;
  color *= 1.0 - shoulder * 0.10 * (1.0 - diffuse);
  color += vec3(1.0, 0.94, 0.86) * sheen * 0.1;
  gl_FragColor = vec4(color, 1.0);
}`;

function drawWallShadow(context, ties, width, height) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = 'rgba(48, 38, 28, .20)';
  for (const {cloth} of ties) {
    const {rows, points} = cloth;
    function mark(row, column, first = false) {
      const index = 3 * (row.start + column);
      const lift = Math.max(17, 42 + points[index + 2]);
      const x = points[index] + lift * .18;
      const y = points[index + 1] + lift * .29;
      if (first) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    // Each leaf casts its own shadow as its angle and distance change.
    const tail = rows.slice(0, cloth.tail.length + 1);
    const blade = rows.slice(cloth.tail.length + 12);
    for (const leaf of [tail, blade]) {
      context.beginPath();
      leaf.forEach((r, i) => mark(r, 0, i === 0));
      for (let i = leaf.length - 1; i >= 0; i--) mark(leaf[i], columns - 1);
      context.closePath();
      context.fill();
    }

  }
}

// Draw the same simulated surface if the browser cannot create a WebGL context.
// A depth buffer keeps the blade, rear leaf and rail in their proper order.
function makeCanvasRenderer(row) {
  const canvas = row.querySelector('.rack-cloth');
  const context = canvas.getContext('2d');
  if (!context) return null;
  const shadow = row.querySelector('.rack-shadow'), shadowContext = shadow.getContext('2d');
  const atlas = new Image();
  let pixels, frame, depth, rodDepth, scale, w, h;
  atlas.onload = () => {
    const source = document.createElement('canvas');
    source.width = atlas.width;
    source.height = atlas.height;
    const sourceContext = source.getContext('2d');
    sourceContext.drawImage(atlas, 0, 0);
    pixels = sourceContext.getImageData(0, 0, atlas.width, atlas.height).data;
    row.dispatchEvent(new Event('silkready'));
  };
  atlas.src = '/rack-assets/silk-atlas.webp';

  function paint(cloth) {
    const points = cloth.points, uv = cloth.uv, triangles = cloth.indices;
    const width = frame.width, height = frame.height, rgba = frame.data;
    for (let t = 0; t < triangles.length; t += 3) {
      const a = triangles[t], b = triangles[t + 1], c = triangles[t + 2];
      const i = 3 * a, j = 3 * b, k = 3 * c;
      const x = points[i] * scale, z = points[i + 2], y = (points[i + 1] - .075 * z) * scale;
      const dz1 = points[j + 2] - z, dz2 = points[k + 2] - z;
      const dx1 = (points[j] - points[i]) * scale, dx2 = (points[k] - points[i]) * scale;
      const dy1 = (points[j + 1] - points[i + 1] - .075 * dz1) * scale;
      const dy2 = (points[k + 1] - points[i + 1] - .075 * dz2) * scale;
      const area = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(area) < .001) continue;
      const x0 = Math.max(0, Math.floor(x + Math.min(0, dx1, dx2)));
      const x1 = Math.min(width - 1, Math.ceil(x + Math.max(0, dx1, dx2)));
      const y0 = Math.max(0, Math.floor(y + Math.min(0, dy1, dy2)));
      const y1 = Math.min(height - 1, Math.ceil(y + Math.max(0, dy1, dy2)));
      const nx = (dy1 * dz2 - dy2 * dz1) * scale / area;
      const ny = (dx1 * dz2 - dx2 * dz1) * scale / area;
      const norm = Math.sqrt(nx * nx + ny * ny + 1);
      const shade = .6 + .5 * Math.max(0, (-.34 * nx + .59 * ny + .74) / norm);
      const u = uv[2 * a], v = uv[2 * a + 1];
      const du1 = uv[2 * b] - u, du2 = uv[2 * c] - u;
      const dv1 = uv[2 * b + 1] - v, dv2 = uv[2 * c + 1] - v;
      for (let sy = y0; sy <= y1; sy++) {
        for (let sx = x0; sx <= x1; sx++) {
          const ex = sx + .5 - x, ey = sy + .5 - y;
          const wb = (ex * dy2 - ey * dx2) / area, wc = (ey * dx1 - ex * dy1) / area;
          if (wb < 0 || wc < 0 || wb + wc > 1) continue;
          const offset = sy * width + sx;
          const surface = z + wb * dz1 + wc * dz2;
          if (surface < depth[offset]) continue;
          depth[offset] = surface;
          const tx = Math.floor((u + wb * du1 + wc * du2) * atlas.width);
          const ty = Math.floor((1 - v - wb * dv1 - wc * dv2) * atlas.height);
          const src = (ty * atlas.width + tx) * 4, dest = offset * 4;
          rgba[dest] = pixels[src] * shade;
          rgba[dest + 1] = pixels[src + 1] * shade;
          rgba[dest + 2] = pixels[src + 2] * shade;
          rgba[dest + 3] = 255;
        }
      }
    }
  }
  return {
    canvas,
    dispose() { atlas.onload = null; },
    layout(width, height, left, right) {
      w = width; h = height;
      scale = Math.min(1, 1600 / w);
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
      canvas.style.width = shadow.style.width = w + 'px';
      canvas.style.height = shadow.style.height = h + 'px';
      shadow.width = Math.ceil(w / 2);
      shadow.height = Math.ceil(h / 2);
      shadowContext.setTransform(.5, 0, 0, .5, 0, 0);
      frame = context.createImageData(canvas.width, canvas.height);
      depth = new Float32Array(canvas.width * canvas.height);
      rodDepth = new Float32Array(depth.length).fill(-Infinity);
      for (let y = 0; y < canvas.height; y++) {
        const dy = (y + .5) / scale - rodY;
        if (Math.abs(dy) >= rodRadius) continue;
        rodDepth.fill(Math.sqrt(rodRadius ** 2 - dy ** 2),
          y * canvas.width + Math.ceil(left * scale), y * canvas.width + Math.floor(right * scale));
      }
    },
    draw(ties) {
      if (!frame || !pixels) return;
      depth.set(rodDepth);
      frame.data.fill(0);
      for (const tie of ties) paint(tie.cloth);
      context.putImageData(frame, 0, 0);
      drawWallShadow(shadowContext, ties, w, h);
    }
  };
}

function makeRenderer(row) {
  const T = THREE;
  const canvas = row.querySelector('.rack-cloth');
  const shadow = row.querySelector('.rack-shadow');
  const shadowContext = shadow.getContext('2d');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({canvas, alpha: true, antialias: true});
  } catch {
    return makeCanvasRenderer(row);
  }
  renderer.setClearColor(0, 0);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(0, 1, 0, -1, 1, 2600);
  camera.position.z = 1000;
  const texture = new T.TextureLoader().load('/rack-assets/silk-atlas.webp', () => row.dispatchEvent(new Event('silkready')));
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const fabric = new T.ShaderMaterial({
    vertexShader: clothVertex, fragmentShader: clothFragment, side: T.DoubleSide,
    uniforms: {atlas: {value: texture}}
  });
  // A depth-only cylinder lets the CSS rail occlude the rear leaf.
  const cylinder = new T.Mesh(
    new T.CylinderGeometry(rodRadius, rodRadius, 1, 24),
    new T.MeshBasicMaterial({colorWrite: false})
  );
  cylinder.rotation.z = Math.PI / 2;
  cylinder.renderOrder = -2;
  scene.add(cylinder);

  const meshes = [];
  let width, height;
  return {
    canvas,
    dispose() {
      meshes.forEach(mesh => mesh.geometry.dispose());
      cylinder.geometry.dispose();
      cylinder.material.dispose();
      fabric.dispose();
      texture.dispose();
      renderer.dispose();
    },
    layout(w, h, left, right, ties) {
      width = w; height = h;
      // Full retina resolution, capped by a total pixel budget for very wide rows.
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2, Math.sqrt(5e6 / (w * h))));
      renderer.setSize(w, h);
      shadow.width = Math.ceil(w / 2);
      shadow.height = Math.ceil(h / 2);
      shadow.style.width = `${w}px`;
      shadow.style.height = `${h}px`;
      shadowContext.setTransform(.5, 0, 0, .5, 0, 0);
      camera.right = w; camera.bottom = -h;
      camera.updateProjectionMatrix();
      cylinder.position.set((left + right) / 2, -rodY, 0);
      cylinder.scale.y = right - left;
      ties.forEach((tie, i) => {
        if (meshes[i]) return;
        const geom = new T.BufferGeometry();
        geom.setIndex(tie.cloth.indices);
        geom.setAttribute('normal', new T.BufferAttribute(new Float32Array(tie.cloth.points.length), 3).setUsage(T.DynamicDrawUsage));
        geom.setAttribute('position', new T.BufferAttribute(new Float32Array(tie.cloth.points.length), 3).setUsage(T.DynamicDrawUsage));
        geom.setAttribute('occlusion', new T.BufferAttribute(new Float32Array(tie.cloth.layerShade.length), 1).setUsage(T.DynamicDrawUsage));
        geom.setAttribute('crossThread', new T.BufferAttribute(new Float32Array(tie.cloth.points.length), 3).setUsage(T.DynamicDrawUsage));
        geom.setAttribute('uv', new T.BufferAttribute(tie.cloth.uv, 2));
        const mesh = new T.Mesh(geom, fabric);
        mesh.frustumCulled = false;
        scene.add(mesh);
        meshes[i] = mesh;
      });
    },
    draw(ties) {
      if (!width || !height) return;
      drawWallShadow(shadowContext, ties, width, height);
      ties.forEach((tie, i) => {
        const geom = meshes[i].geometry;
        tie.cloth.solveLayers(true);
        geom.attributes.occlusion.array.set(tie.cloth.layerShade);
        geom.attributes.occlusion.needsUpdate = true;
        const position = geom.attributes.position;
        const points = tie.cloth.points;
        for (let p = 0; p < position.count; p++) {
          const z = points[3 * p + 2];
          const col = p % columns;
          const left = 3 * (col ? p - 1 : p), right = 3 * (col + 1 < columns ? p + 1 : p);
          geom.attributes.crossThread.setXYZ(p, points[right] - points[left],
            points[left + 1] - points[right + 1], points[right + 2] - points[left + 2]);
          position.setXYZ(p, points[3 * p], -points[3 * p + 1] + z * .075, z);
        }
        geom.attributes.crossThread.needsUpdate = true;
        position.needsUpdate = true;
        // Central differences give the smooth surface normal without walking
        // every indexed triangle and normalizing a second time on the CPU.
        const normals = geom.attributes.normal;
        const coords = position.array, across = geom.attributes.crossThread.array;
        for (let v = 0; v < position.count; v++) {
          const j = v * 3;
          const prev = v >= columns ? j - 3 * columns : j;
          const next = v + columns < position.count ? j + 3 * columns : j;
          const x = coords[next] - coords[prev], y = coords[next + 1] - coords[prev + 1];
          const z = coords[next + 2] - coords[prev + 2];
          normals.setXYZ(v, y * across[j + 2] - z * across[j + 1],
            z * across[j] - x * across[j + 2], x * across[j + 1] - y * across[j]);
        }
        normals.needsUpdate = true;
      });
      renderer.render(scene, camera);
    }
  };
}

function paintRailReflections(row) {
  const texture = document.createElement('canvas');
  texture.width = 1024;
  texture.height = 64;
  const context = texture.getContext('2d');
  if (!context) return;

  const ramp = context.createLinearGradient(0, 0, 0, texture.height);
  ramp.addColorStop(0, '#5a6269');
  ramp.addColorStop(.12, '#d1d9db');
  ramp.addColorStop(.25, '#fbf9f1');
  ramp.addColorStop(.38, '#9eabb3');
  ramp.addColorStop(.51, '#353e48');
  ramp.addColorStop(.67, '#bac2c5');
  ramp.addColorStop(.78, '#e9e7df');
  ramp.addColorStop(1, '#515d68');
  context.fillStyle = ramp;
  context.fillRect(0, 0, 1, texture.height);
  const colors = context.getImageData(0, 0, 1, texture.height).data;
  const reflection = context.createImageData(texture.width, texture.height);

  // Bend the reflected bands through the middle and keep the cylinder's rim straight.
  for (let y = 0; y < texture.height; y++) {
    const vertical = y / (texture.height - 1);
    const edgeFade = Math.sin(vertical * Math.PI);
    for (let x = 0; x < texture.width; x++) {
      const along = x / texture.width * Math.PI * 2;
      const swell = Math.sin(along * 5.7 + vertical * 4.2);
      const ripple = Math.sin(along * 12.4 - vertical * 6 + swell * 1.7);
      const warped = vertical + edgeFade * (.18 * swell + .075 * ripple);
      const color = Math.round(clamp(warped, 0, 1) * (texture.height - 1)) * 4;
      const pixel = (y * texture.width + x) * 4;
      reflection.data[pixel] = colors[color];
      reflection.data[pixel + 1] = colors[color + 1];
      reflection.data[pixel + 2] = colors[color + 2];
      reflection.data[pixel + 3] = 255;
    }
  }

  context.putImageData(reflection, 0, 0);
  row.style.setProperty('--rail-reflections', `url("${texture.toDataURL()}")`);
}

export function mountTieRack(section, onInspect, onActive) {
  const row = section.querySelector('#row');
  const rw = section.querySelector('#rw');
  const listeners = new AbortController();
  const {signal} = listeners;
  paintRailReflections(row);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rack = makeRenderer(row);
  const ties = [...row.querySelectorAll('.rack-item')].map(hanger => {
    const {id} = hanger.dataset;
    return {id, ...PRODUCTS[id], hanger, button: hanger.querySelector('.tie')};
  });
  const leftCap = row.querySelector('.kn.l'), rightCap = row.querySelector('.kn.r');
  let active = -1, hover = -1, focus = -1, touch = -1, product = -1;
  let tabNavigation = false, pointer = null, onscreen = true;
  let height = 0, width = 0, railLeft = 0, railRight = 0, opening = 0, contacts = [];
  let frame = 0, lastTime = 0, accumulator = 0, quiet = 0;
  let atlasReady = false;
  row.addEventListener('silkready', () => {
    atlasReady = true;
    row.classList.add('has-cloth');
    draw();
  }, {signal});
  if (rack) rack.canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    atlasReady = false;
    row.classList.remove('has-cloth');
  }, {signal});
  if (rack) rack.canvas.addEventListener('webglcontextrestored', () => {
    atlasReady = true;
    row.classList.add('has-cloth');
    draw();
  }, {signal});

  ties.forEach((tie, i) => {
    tie.profile = profiles[i];
    tie.origin = (tie.profile.blade[0][1] + tie.profile.blade[0][2]) / 2;
    tie.base = boundsFor(tie.profile);
    tie.wrist = tie.aim = tie.approach = 0;
    tie.load = tie.guideLoad = tie.pressure = tie.compression = tie.v = tie.pull = tie.pullV = 0;
    tie.contactY = rodY;
    tie.contactSide = 1;
    tie.hanger.style.setProperty('--silk', tie.profile.silk);
    tie.button.addEventListener('focus', () => {
      if (tabNavigation || tie.button.matches(':focus-visible')) {
        focus = i;
        hover = touch = -1;
        select();
      }
    }, {signal});
    tie.button.addEventListener('blur', () => {
      if (focus === i) {focus = -1; select()}
    }, {signal});
    tie.button.addEventListener('click', event => {
      if (event.pointerType === 'touch' && touch !== i) {
        hover = focus = -1;
        touch = i;
        select();
        return;
      }
      openDetail(i);
    }, {signal});
  });

  function layout() {
    const nextHeight = row.clientHeight;
    const viewport = rw.clientWidth;
    const scale = nextHeight / 788;
    const narrow = viewport < 760;
    opening = clamp(nextHeight * (narrow ? .088 : .185), 28, narrow ? 48 : 125);
    const capInset = leftCap.offsetLeft + leftCap.offsetWidth / 2;
    let combined = 0;
    ties.forEach(tie => {
      tie.left = (tie.origin - tie.base[0]) * scale;
      tie.right = (tie.base[1] - tie.origin) * scale;
      tie.shoulder = (tie.profile.blade[0][2] - tie.origin) * scale;
      combined += tie.left + tie.right;
      tie.hanger.style.setProperty('--hit-left', `${-tie.left}px`);
      tie.hanger.style.setProperty('--hit-width', `${tie.left + tie.right}px`);
      tie.hanger.style.setProperty('--shoulder', `${tie.shoulder * 2}px`);
      tie.hanger.style.setProperty('--image-left', `${tie.origin * -scale}px`);
    });
    const nextWidth = Math.ceil(Math.max(viewport, capInset * 2 + combined + (narrow ? 176 : 216)));
    if (nextHeight === height && nextWidth === width) return;
    width = nextWidth;
    row.style.width = `${width}px`;
    row.style.setProperty('--art-height', `${nextHeight}px`);
    railLeft = leftCap.offsetLeft + leftCap.offsetWidth / 2 + 2;
    railRight = rightCap.offsetLeft + rightCap.offsetWidth / 2 - 2;
    const free = railRight - railLeft - combined;
    const gutter = clamp((railRight - railLeft) * .105, narrow ? 43 : 56, (free - (narrow ? 69 : 87)) / 2);
    const gap = (free - 2 * gutter) / (ties.length - 1);
    let x = railLeft + gutter;
    ties.forEach(tie => {
      const rest = x + tie.left;
      const oldSlot = tie.slot;
      tie.slot = height ? tie.slot + rest - tie.rest : rest;
      tie.rest = rest;
      tie.min = railLeft + Math.max(21 + tie.shoulder, tie.left - 2);
      tie.max = railRight - Math.max(21 + tie.shoulder, tie.right - 2);
      x += tie.left + tie.right + gap;
      if (rack) {
        const cloth = new SilkStrip(tie.profile, ties.indexOf(tie), scale, tie.slot);
        if (tie.cloth) cloth.rebase(tie.cloth, oldSlot, tie.slot);
        tie.cloth = cloth;
      }
    });
    if (rack) {
      contacts = ties.slice(0, -1).map((tie, i) => contactPairs(tie.cloth, ties[i + 1].cloth));
      rack.layout(width, nextHeight + 98, railLeft, railRight, ties);
    }
    const initial = !height;
    height = nextHeight;
    targets();
    if (initial && rack && !reduced.matches) {
      for (let i = 0; i < 60; i++) simulate();
    }
    row.classList.add('ready');
    draw();
  }

  function targets() {
    const offset = reduced.matches ? 10 : opening;
    ties.forEach((tie, i) => {
      const distance = i - active;
      let aim = tie.rest;
      if (active >= 0 && Math.abs(distance) === 1) aim += Math.sign(distance) * offset;
      if (active === i && (i === 0 || i === ties.length - 1)) {
        aim += (i === 0 ? -1 : 1) * offset * .12;
      }
      tie.target = clamp(aim, tie.min, tie.max);
    });
    wake();
  }

  function select() {
    const next = hover >= 0 ? hover : focus >= 0 ? focus : touch;
    if (next === active) return;
    if (frame && !reduced.matches) advanceTo(performance.now());
    active = next;
    ties.forEach((tie, i) => tie.hanger.classList.toggle('is-active', i === active));
    onActive(ties[active]?.name ?? null);
    targets();
  }

  function moveGuides() {
    ties.forEach((tie, i) => {
      tie.wrist = mix(tie.wrist, tie.aim, .085);
      const holding = i === active ? 1 : 0;
      tie.pullV += (110 * (holding - tie.pull) - 18 * tie.pullV) * step;
      tie.pull += tie.pullV * step;
      const force = 138 * (tie.target - tie.slot) - (23 + Math.min(5, tie.pressure * .22)) * tie.v;
      tie.guideLoad += (clamp(tie.load, -20, 20) - tie.guideLoad) * .19;
      const acceleration = clamp(force - tie.guideLoad * 370, -5250, 5250);
      tie.v = clamp(tie.v + acceleration * step, -420, 420);
      tie.slot += tie.v * step;
      const limited = clamp(tie.slot, tie.min, tie.max);
      if (limited !== tie.slot) {
        tie.slot = limited;
        tie.v = 0;
      }
      tie.pressure += (Math.min(22, tie.compression * 2.2) - tie.pressure) * .10;
      tie.load = tie.compression = 0;
    });

    for (let i = 1; i < ties.length; i++) {
      const left = ties[i - 1], right = ties[i];
      const overlap = left.slot + left.shoulder + right.shoulder + 1.6 - right.slot;
      if (overlap <= 0) continue;
      const room = Math.max(0, left.slot - left.min);
      const correction = Math.min(overlap / 2, room);
      left.slot -= correction;
      right.slot += overlap - correction;
      if (left.v > right.v) left.v = right.v = (left.v + right.v) * .5;
      left.compression = right.compression = overlap;
      left.contactY = right.contactY = rodY + 31;
      left.contactSide = 1;
      right.contactSide = -1;
    }
  }

  function simulate() {
    moveGuides();
    if (!rack) return;
    ties.forEach(tie => tie.cloth.integrate(tie));
    for (let i = 0; i < iterations; i++) {
      ties.forEach(tie => {tie.cloth.solvePinch(tie); tie.cloth.solveLinks()});
      contacts.forEach((pairs, j) => collide(ties[j], ties[j + 1], pairs, i === 0));
      ties.forEach(tie => {tie.cloth.solveLayers(); tie.cloth.solveRod()});
    }
  }

  function draw() {
    if (!height) return;
    ties.forEach(tie => tie.hanger.style.setProperty('--slot', `${tie.slot}px`));
    if (rack && atlasReady) rack.draw(ties);
  }

  function advanceTo(now) {
    if (now <= lastTime) return;
    // Account for input between paints, including handoffs on a busy frame.
    accumulator += Math.min((now - lastTime) / 1000, maxSubsteps * step);
    lastTime = now;
    while (accumulator >= step) {
      simulate();
      accumulator -= step;
    }
  }

  function tick() {
    frame = 0;
    advanceTo(performance.now());
    draw();
    const moving = ties.some(tie =>
      Math.abs(tie.v) > .65 || Math.abs(tie.pullV) > .012 || (rack && tie.cloth.motion() > .037));
    quiet = moving ? 0 : quiet + 1;
    if (quiet < 12 && onscreen) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (reduced.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ties.forEach(tie => {
        tie.slot = tie.target;
        tie.pull = tie.pullV = tie.v = tie.load = tie.guideLoad = tie.pressure = tie.compression = 0;
        if (tie.cloth) tie.cloth.reset(tie.slot);
      });
      draw();
      return;
    }
    quiet = 0;
    if (!frame && height && onscreen) {
      accumulator = 0;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function clearHover() {
    hover = -1;
    pointer = null;
    select();
  }

  rw.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || product >= 0) return;
    const {clientX: x, clientY: y} = event;
    if (pointer && Math.hypot(x - pointer.x, y - pointer.y) < 5) return;
    const previousX = pointer?.x;
    pointer = {x, y};
    const bounds = row.getBoundingClientRect();
    const localX = x - bounds.left, localY = y - bounds.top;
    const overTie = localY >= 7 && localY <= height + 28;
    const next = overTie ? ties.findIndex((tie, i) =>
      localX >= tie.slot - tie.left + (i === hover ? 0 : 5) &&
      localX <= tie.slot + tie.right - (i === hover ? 0 : 5)) : -1;
    if (next >= 0) {
      const tie = ties[next];
      const within = clamp((localX - tie.slot) / Math.max(25, tie.shoulder), -1, 1);
      if (next !== hover) tie.approach = previousX == null ? within : Math.sign(previousX - x) || within;
      tie.aim = .65 * tie.approach + .35 * within;
      if (next === active && !reduced.matches) wake();
      hover = next;
      focus = touch = -1;
    } else if (hover >= 0) {
      const tie = ties[hover];
      if (localX < tie.slot - tie.left - 23 || localX > tie.slot + tie.right + 23 ||
          localY < 0 || localY > height + 47) hover = -1;
    }
    select();
  }, {signal});
  rw.addEventListener('pointerleave', clearHover, {signal});
  rw.addEventListener('pointercancel', clearHover, {signal});
  rw.addEventListener('pointerdown', () => {tabNavigation = false}, {signal});
  window.addEventListener('keydown', event => {if (event.key === 'Tab') tabNavigation = true}, {capture: true, signal});
  const visibility = new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    if (onscreen) wake();
    else {touch = -1; clearHover()}
  });
  visibility.observe(rw);
  reduced.addEventListener('change', targets, {signal});
  const resize = new ResizeObserver(layout);
  resize.observe(rw);
  layout();

  const requestedId = new URLSearchParams(location.search).get('tie');
  const requestedTie = ties.findIndex(tie => tie.id === requestedId);
  const request = requestedTie >= 0 && requestAnimationFrame(() => {
    ties[requestedTie].button.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'});
    openDetail(requestedTie);
  });

  function openDetail(i) {
    product = i;
    focus = touch = -1;
    clearHover();
    const tie = ties[i];
    onInspect({id: tie.id, button: tie.button, onClose: () => {product = -1;}});
  }

  return {
    inspectActive() { if (active >= 0) openDetail(active); },
    dispose() {
      listeners.abort();
      visibility.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      if (request) cancelAnimationFrame(request);
      rack?.dispose();
    }
  };
}
