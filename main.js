var userName = "", algo = "", dtype = "", first = true;
var stack = [];   // STACK only: last element = top
var cap = 0;      // STACK only: number of blocks (the size)
var arr = [];     // ARRAY only: index 0 = first block

function $(id) { return document.getElementById(id); }
function show(id) {
  document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
  $(id).classList.add("active");
}
function clearErr() {
  document.querySelectorAll(".error").forEach(function (e) { e.textContent = ""; });
}
function esc(s) {
  return s.replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ---------- WELCOME PAGE / LOGIN ---------- */
function submitName() {
  var n = $("name").value.trim();
  if (!n) { $("e-name").textContent = "Please enter your name."; return; }
  userName = n;
  $("avatar").textContent = n.charAt(0).toUpperCase();
  $("pname").textContent = n;
  $("profile").classList.remove("hidden");
  goHome();
}
$("btn-name").onclick = submitName;
$("name").addEventListener("keydown", function (e) { if (e.key === "Enter") submitName(); });

/* ---------- EXIT (logout) ---------- */
$("btn-exit").onclick = function () {
  userName = ""; algo = ""; first = true;
  stack = []; arr = []; cap = 0;
  $("name").value = "";
  $("profile").classList.add("hidden");
  clearErr();
  show("s-name");
  $("name").focus();
};

/* ---------- HOME PAGE ---------- */
function goHome() {
  clearErr();
  stack = []; arr = []; cap = 0; algo = "";
  $("greeting").textContent = (first ? "Hello, " : "Welcome, ") + userName + "!";
  first = false;
  show("s-menu");
}
document.querySelectorAll(".card").forEach(function (c) {
  c.onclick = function () { openSetup(c.dataset.algo); };
});
$("btn-back").onclick = goHome;
$("btn-home").onclick = goHome;
$("btn-no").onclick = goHome;

/* ---------- SETUP ---------- */
var INFO = {
  stack: {
    t: "Stack",
    h: "<b>Instructions</b><ol><li>A stack is <b>Last In, First Out (LIFO)</b>. The last element added is the first one out.</li><li>Choose a datatype and the size of your stack.</li><li>Enter each element, from <b>bottom to top</b>.</li><li>Then choose an operation: <b>Pop</b> (remove the top element, its block stays empty) or <b>Push</b> (add a new value on top, into the next empty block).</li></ol>"
  },
  array: {
    t: "Array",
    h: "<b>Instructions</b><ol><li>An array is a row of <b>blocks</b>. Each block has an <b>index</b> that starts at 0.</li><li>Choose a datatype and the size of your array.</li><li>Enter each element, starting at <b>index 0</b>.</li><li>Then choose an operation: <b>Insert</b> (add a value at an index) or <b>Delete</b> (remove the block at an index).</li></ol>"
  }
};

function openSetup(a) {
  algo = a;
  clearErr();
  $("setup-title").textContent = INFO[a].t;
  $("instructions").innerHTML = INFO[a].h;
  $("size").value = "";
  $("fields").innerHTML = "";
  $("btn-setup").classList.add("hidden");
  show("s-setup");
}

$("btn-size").onclick = function () {
  $("e-setup").textContent = "";
  var n = parseInt($("size").value, 10);
  if (!n || n < 1 || n > 12) { $("e-setup").textContent = "Size must be between 1 and 12."; return; }
  var h = "";
  for (var i = 0; i < n; i++) {
    var label;
    if (algo === "stack") {
      label = "Element " + (i + 1) + (i === 0 ? " (bottom)" : i === n - 1 ? " (top)" : "");
    } else {
      label = "Index " + i;
    }
    h += '<input class="el" style="animation-delay:' + (i * 0.05) + 's" type="text" placeholder="' + label + '">';
  }
  $("fields").innerHTML = h;
  $("btn-setup").classList.remove("hidden");
};

/* ---------- DATATYPE CHECK (FIXED) ---------- */
function check(t, v) {
  if (v === "") return "cannot be empty.";
  if (t === "Integer" && !/^[-+]?\d+$/.test(v)) return '"' + v + '" is not a valid Integer.';
  if (t === "Double" && !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(v)) return '"' + v + '" is not a valid Double.';
  if (t === "Character" && !/^[A-Za-z]$/.test(v)) return '"' + v + '" is not a valid Character. Enter a single letter (A-Z).';
  return null;
}

$("btn-setup").onclick = function () {
  var t = $("type").value;
  dtype = t;
  var els = document.querySelectorAll(".el");
  var tmp = [];
  for (var i = 0; i < els.length; i++) {
    var v = els[i].value.trim();
    var bad = check(t, v);
    if (bad) { $("e-setup").textContent = "Element " + (i + 1) + ": " + bad; return; }
    tmp.push(v);
  }
  if (algo === "stack") { stack = tmp; cap = tmp.length; } else { arr = tmp; }
  openOps();
};

/* ---------- OPERATIONS ---------- */
function openOps() {
  clearErr();
  $("op-input").value = "";
  $("op-value").value = "";
  if (algo === "stack") {
    $("op-title").textContent = "Stack – Operations";
    renderStack($("visual-op"), -1, -1, "");
    $("op-input").placeholder = "Position of the top (for Pop)";
    $("op-value").placeholder = "Value (for Push)";
    $("op-input").classList.remove("hidden");
    $("op-value").classList.remove("hidden");
    $("op-buttons").innerHTML = '<button data-op="pop">Pop</button><button data-op="push">Push</button>';
  } else {
    $("op-title").textContent = "Array – Operations";
    renderArray($("visual-op"), -1);
    $("op-input").placeholder = "Index (0, 1, 2...)";
    $("op-value").placeholder = "Value (for Insert)";
    $("op-input").classList.remove("hidden");
    $("op-value").classList.remove("hidden");
    $("op-buttons").innerHTML = '<button data-op="insert">Insert</button><button data-op="delete">Delete</button>';
  }
  $("op-buttons").querySelectorAll("button").forEach(function (b) {
    b.onclick = function () { runOp(b.dataset.op); };
  });
  show("s-op");
}

function runOp(op) {
  $("result-msg").classList.remove("bad");
  if (algo === "stack") { stackOp(op); } else { arrayOp(op); }
}

/* STACK operations
   Pop  = remove the top (the block stays, it becomes empty)
   Push = add a value on top, into the next empty block */
function stackOp(op) {
  if (op === "pop") {
    var top = stack.length;
    if (top === 0) { $("e-op").textContent = "The stack is empty (underflow). Use Push to add a value."; return; }
    var v = $("op-input").value.trim();
    if (!/^\d+$/.test(v)) { $("e-op").textContent = "Enter the position number of the top block."; return; }
    var n = parseInt(v, 10);
    if (n < 1 || n > cap) { $("e-op").textContent = "Enter a position from 1 to " + cap + "."; return; }
    if (n > top) { $("e-op").textContent = "Position " + n + " is already empty. The top is position " + top + "."; return; }
    if (n < top) { $("e-op").textContent = "Stack is Last In, First Out. Only the top (position " + top + ") can be popped."; return; }
    var val = stack.pop();
    $("result-msg").textContent = "Popped " + val + " from position " + n + ". The block stays empty.";
    renderStack($("visual-result"), -1, n - 1, val);
  } else {
    if (stack.length >= cap) {
      $("result-msg").classList.add("bad");
      $("result-msg").textContent = "INVALID: the stack is full. Pop first to make an empty block.";
      renderStack($("visual-result"), -1, -1, "", cap - 1);
      $("continue-area").classList.remove("hidden");
      $("empty-area").classList.add("hidden");
      show("s-result");
      return;
    }
    var nv = $("op-value").value.trim();
    var bad = check(dtype, nv);
    if (bad) { $("e-op").textContent = "Value " + bad; return; }
    stack.push(nv);
    var pos = stack.length;
    $("result-msg").textContent = "Pushed " + nv + " into position " + pos + ". It is the top now.";
    renderStack($("visual-result"), pos - 1, -1, "");
  }

  // the stack stays usable even when it is empty (Push can add again)
  $("continue-area").classList.remove("hidden");
  $("empty-area").classList.add("hidden");
  show("s-result");
}

/* ARRAY operations (insert, delete) */
function arrayOp(op) {
  var v = $("op-input").value.trim();
  if (!/^\d+$/.test(v)) { $("e-op").textContent = "Enter an index (0, 1, 2...)."; return; }
  var i = parseInt(v, 10), msg, hl = -1;

  if (op === "insert") {
    if (arr.length >= 12) { $("e-op").textContent = "The array is full (max 12 blocks)."; return; }
    if (i > arr.length) { $("e-op").textContent = "Index must be from 0 to " + arr.length + "."; return; }
    var val = $("op-value").value.trim();
    var bad = check(dtype, val);
    if (bad) { $("e-op").textContent = "Value " + bad; return; }
    arr.splice(i, 0, val);
    hl = i;
    msg = "Inserted " + val + " at index " + i + ". The blocks after it moved to the right.";
  } else {
    if (i >= arr.length) { $("e-op").textContent = "Index must be from 0 to " + (arr.length - 1) + "."; return; }
    msg = "Deleted " + arr.splice(i, 1)[0] + " from index " + i + ". The blocks after it moved to the left.";
  }

  $("result-msg").textContent = msg;
  renderArray($("visual-result"), hl);
  var empty = arr.length === 0;
  $("continue-area").classList.toggle("hidden", empty);
  $("empty-area").classList.toggle("hidden", !empty);
  show("s-result");
}

$("btn-yes").onclick = openOps;

/* ---------- VISUALS ---------- */
// Always draws "cap" blocks. Popped blocks stay on screen as empty blocks.
function renderStack(el, pushed, popIdx, popVal, badIdx) {
  el.className = "visual stack";
  var rows = "";
  for (var i = cap - 1; i >= 0; i--) {
    var cell;
    if (i < stack.length) {
      cell = '<div class="cell' + (i === pushed ? " hl" : "") + (i === badIdx ? " bad" : "") + '" style="animation-delay:' +
        ((cap - 1 - i) * 0.04) + 's">' + esc(stack[i]) + "</div>";
    } else {
      var gone = (i === popIdx) ? '<span class="gone">' + esc(popVal) + "</span>" : "";
      cell = '<div class="cell vacant' + (i === popIdx ? " popped" : "") + (i === badIdx ? " bad" : "") + '">' + gone + (i === badIdx ? "invalid" : "empty") + "</div>";
    }
    var ptr = (i === stack.length - 1) ? "◀ TOP" : "";
    rows += '<div class="srow"><span class="idx">' + (i + 1) + "</span>" + cell +
      '<span class="ptr">' + ptr + "</span></div>";
  }
  el.innerHTML = '<div class="tag">TOP ▼</div>' + rows + '<div class="tag">BOTTOM</div>';
}

function renderArray(el, hl) {
  el.className = "visual array";
  if (arr.length === 0) { el.innerHTML = '<div class="empty">( empty )</div>'; return; }
  el.innerHTML = arr.map(function (v, i) {
    return '<div class="blk"><div class="cell' + (i === hl ? " hl" : "") + '" style="animation-delay:' +
      (i * 0.05) + 's">' + esc(v) + '</div><div class="idx">' + i + "</div></div>";
  }).join("");
}

/* ---------- SPACE BACKGROUND: stars, sparkles, drifting dust, nebula orbs, shooting stars ---------- */
var cv = $("stars"), ctx = cv.getContext("2d");
var stars = [], sparks = [], parts = [], orbs = [], meteors = [], nextMeteor = 1200;
var rocks = [], frags = [], fx = [], nextPair = 1500, ambientTarget = 8, nextAmbient = 0;
var W = 0, H = 0, mx = 0, my = 0, tx = 0, ty = 0, last = 0;
function rnd(a, b) { return a + Math.random() * (b - a); }
function resize() {
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  stars = [];
  var n = Math.min(450, Math.round(W * H / 5000));
  for (var i = 0; i < n; i++) {
    var big = Math.random() < 0.06;
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: big ? rnd(1.2, 2) : rnd(0.25, 1.0),
      a: rnd(0.25, 0.9), p: rnd(0, 6.28), s: rnd(0.4, 1.4), big: big });
  }
  sparks = [[.15, .59, 15], [.077, .67, 24], [.87, .75, 18], [.97, .92, 28], [.22, .2, 10], [.84, .18, 12]].map(function (q) {
    return { x: q[0] * W, y: q[1] * H, s: q[2], p: rnd(0, 6.28) };
  });
  // drifting space dust (3 depth layers via d)
  parts = [];
  var pn = Math.min(190, Math.round(W * H / 10000));
  for (var j = 0; j < pn; j++) {
    var d = rnd(0.25, 1);
    parts.push({ x: Math.random() * W, y: Math.random() * H, d: d, r: 0.4 + d * 1.3,
      vx: rnd(-0.05, 0.05) * (0.5 + d), vy: -rnd(0.04, 0.2) * (0.4 + d),
      a: rnd(0.2, 0.7), p: rnd(0, 6.28), warm: Math.random() < 0.15 });
  }
  // faint out-of-focus nebula orbs
  orbs = [];
  var cols = ["80,150,255", "130,110,255", "110,200,255"];
  for (var o = 0; o < 9; o++) {
    orbs.push({ x: Math.random() * W, y: Math.random() * H, r: rnd(40, 110), vx: rnd(-0.06, 0.06), vy: rnd(-0.04, 0.04),
      a: rnd(0.035, 0.08), c: cols[o % 3] });
  }
}
function sparkle(x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
  ctx.fillStyle = "#a9c8ff"; ctx.shadowColor = "#5f9bff"; ctx.shadowBlur = 16;
  var c = s * 0.09;
  ctx.beginPath(); ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(c, -c, s, 0); ctx.quadraticCurveTo(c, c, 0, s);
  ctx.quadraticCurveTo(-c, c, -s, 0); ctx.quadraticCurveTo(-c, -c, 0, -s);
  ctx.fill(); ctx.restore();
}
/* ---------- ASTEROIDS + COLLISION EXPLOSIONS ---------- */
function rockScale() { return W < 600 ? 0.7 : 1; }
function makeRock(x, y, vx, vy, r, temp) {
  var n = 10 + Math.floor(Math.random() * 4), shape = [], cr = [], i;
  for (i = 0; i < n; i++) shape.push(rnd(0.78, 1.12));
  var cn = 2 + Math.floor(Math.random() * 3);
  for (i = 0; i < cn; i++) cr.push({ a: rnd(0, 6.28), d: rnd(0.1, 0.5), s: rnd(0.14, 0.26) });
  if (r < 6) cr = [];
  return { x: x, y: y, vx: vx, vy: vy, r: r, rot: rnd(0, 6.28), vr: rnd(-0.012, 0.012), shape: shape, cr: cr, temp: !!temp, age: 0, cd: 0 };
}
function initRocks() {
  rocks = []; frags = []; fx = [];
  var n = W < 600 ? 7 : 14, s = rockScale();
  ambientTarget = n;
  for (var i = 0; i < n; i++) {
    var an = rnd(0, 6.28), sp = rnd(0.12, 0.45);
    rocks.push(makeRock(Math.random() * W, Math.random() * H, Math.cos(an) * sp, Math.sin(an) * sp, rnd(4, 11) * s, false));
  }
}
// two asteroids aimed at the same point so they actually meet on screen
function spawnPair() {
  var px = W * rnd(0.2, 0.8), py = H * rnd(0.15, 0.6), D = Math.max(W, H) * 0.75, T = rnd(380, 520);
  var a0 = rnd(0, 6.28), a1 = a0 + rnd(2.4, 3.9), s = rockScale();
  [a0, a1].forEach(function (an) {
    var sp = D / T;
    rocks.push(makeRock(px + Math.cos(an) * D, py + Math.sin(an) * D, -Math.cos(an) * sp, -Math.sin(an) * sp, rnd(5, 11) * s, true));
  });
}
function drawRock(a) {
  var n = a.shape.length, i;
  ctx.beginPath();
  for (i = 0; i < n; i++) {
    var ang = a.rot + i / n * 6.2832, rr = a.r * a.shape[i];
    var px = a.x + Math.cos(ang) * rr, py = a.y + Math.sin(ang) * rr;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
  var g = ctx.createRadialGradient(a.x - a.r * 0.4, a.y - a.r * 0.45, a.r * 0.1, a.x, a.y, a.r * 1.15);
  g.addColorStop(0, "#a9aebb"); g.addColorStop(0.45, "#5c616f"); g.addColorStop(1, "#11131a");
  ctx.globalAlpha = a.alpha === undefined ? 1 : a.alpha; ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(140,195,255,.28)"; ctx.lineWidth = 1; ctx.stroke();
  a.cr.forEach(function (c) {
    var ca = a.rot + c.a, cx = a.x + Math.cos(ca) * a.r * c.d * 1.4, cy = a.y + Math.sin(ca) * a.r * c.d * 1.4, cr = a.r * c.s;
    ctx.fillStyle = "rgba(8,10,18,.38)"; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = "rgba(200,215,255,.14)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, cr, 0.3, 2.3); ctx.stroke();
  });
  ctx.globalAlpha = 1;
}
// the asteroid crumbles into rock fragments + a puff of dust (no sparks)
function shatter(a, cx, cy) {
  var n = Math.max(3, Math.round(a.r / 2.5)), i;
  for (i = 0; i < n; i++) {
    var an = rnd(0, 6.28), off = rnd(0, a.r * 0.6);
    var x = a.x + Math.cos(an) * off, y = a.y + Math.sin(an) * off;
    var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, sp = rnd(0.4, 1.6);
    var f = makeRock(x, y, a.vx * 0.5 + dx / d * sp + rnd(-0.3, 0.3), a.vy * 0.5 + dy / d * sp + rnd(-0.3, 0.3), Math.max(1.3, a.r * rnd(0.15, 0.35)), false);
    f.vr = rnd(-0.1, 0.1); f.life = 0; f.max = rnd(120, 220); f.alpha = 1;
    frags.push(f);
  }
  // quick bright flash + a few sparks
  fx.push({ k: "flash", x: cx, y: cy, vx: 0, vy: 0, r: a.r * 1.8 + 6, life: 0, max: 22 });
  for (i = 0; i < 8; i++) {
    var an2 = rnd(0, 6.28), sp2 = rnd(0.5, 2.2);
    fx.push({ k: "chip", x: cx, y: cy, vx: Math.cos(an2) * sp2, vy: Math.sin(an2) * sp2, rot: rnd(0, 6.28), vr: rnd(-0.2, 0.2), s: rnd(1, 2), life: 0, max: rnd(30, 60) });
  }
}
// new ambient asteroid drifts in from a random screen edge
function spawnAmbient() {
  var s = rockScale(), r = rnd(4, 11) * s, side = Math.floor(Math.random() * 4), sp = rnd(0.15, 0.45), x, y, base;
  if (side === 0) { x = -r - 30; y = rnd(0, H); base = 0; }
  else if (side === 1) { x = W + r + 30; y = rnd(0, H); base = 3.1416; }
  else if (side === 2) { x = rnd(0, W); y = -r - 30; base = 1.5708; }
  else { x = rnd(0, W); y = H + r + 30; base = -1.5708; }
  var an = base + rnd(-0.6, 0.6);
  rocks.push(makeRock(x, y, Math.cos(an) * sp, Math.sin(an) * sp, r, false));
}
function updateRocks(dt, t) {
  var i, j;
  if (t > nextPair && rocks.length < 40) { spawnPair(); nextPair = t + rnd(3000, 6000); }
  if (t > nextAmbient) {
    nextAmbient = t + 2500;
    var amb = 0; rocks.forEach(function (r) { if (!r.temp) amb++; });
    if (amb < ambientTarget) spawnAmbient();
  }
  for (i = 0; i < rocks.length; i++) {
    var a = rocks[i];
    a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; a.age += dt;
    var m = a.r + 24;
    if (!a.temp && a.age > 120) {
      if (a.x < -m) a.x = W + m; else if (a.x > W + m) a.x = -m;
      if (a.y < -m) a.y = H + m; else if (a.y > H + m) a.y = -m;
    }
  }
  rocks = rocks.filter(function (a) {
    var off = a.x < -100 || a.x > W + 100 || a.y < -100 || a.y > H + 100;
    var away = (a.x - W / 2) * a.vx + (a.y - H / 2) * a.vy > 0;   // moving away from the screen
    return !(a.temp && a.age > 30 && off && away);
  });
  for (i = 0; i < rocks.length; i++) {
    for (j = i + 1; j < rocks.length; j++) {
      var p = rocks[i], q = rocks[j];
      if (p.dead || q.dead) continue;
      var dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy), min = p.r + q.r;
      if (d < min && d > 0) {
        var nx = dx / d, ny = dy / d, vn = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
        if (vn < 0 && -vn > 0.1) {                 // real hit: both crumble
          var cxp = p.x + nx * p.r, cyp = p.y + ny * p.r;
          p.dead = q.dead = true;
          shatter(p, cxp, cyp); shatter(q, cxp, cyp);
        } else {                                    // slow touch: just nudge apart
          var ov = (min - d) / 2;
          p.x -= nx * ov; p.y -= ny * ov; q.x += nx * ov; q.y += ny * ov;
          if (vn < 0) {
            var m1 = p.r * p.r, m2 = q.r * q.r, jj = -1.55 * vn / (1 / m1 + 1 / m2);
            p.vx -= jj * nx / m1; p.vy -= jj * ny / m1; q.vx += jj * nx / m2; q.vy += jj * ny / m2;
          }
        }
      }
    }
  }
  rocks = rocks.filter(function (a) { return !a.dead; });
  // fragments drift, slow down a little, then fade away
  var fr = Math.pow(0.997, dt);
  frags = frags.filter(function (f) {
    f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; f.vx *= fr; f.vy *= fr; f.life += dt;
    var p = f.life / f.max;
    f.alpha = p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.35);
    return p < 1;
  });
}
function drawFx(dt) {
  fx = fx.filter(function (e) {
    e.life += dt; var p = e.life / e.max;
    if (p >= 1) return false;
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.k === "flash") {
      var fr2 = e.r * (0.5 + p), fg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, fr2);
      fg.addColorStop(0, "rgba(255,255,255," + (1 - p) + ")");
      fg.addColorStop(0.4, "rgba(255,190,120," + (0.7 * (1 - p)) + ")");
      fg.addColorStop(1, "rgba(255,120,60,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(e.x, e.y, fr2, 0, 6.2832); ctx.fill();
    } else if (e.k === "dust") {
      var rad = e.r * (1 + p * 2), al = 0.26 * (1 - p), g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rad);
      g.addColorStop(0, "rgba(160,172,196," + al + ")"); g.addColorStop(1, "rgba(120,135,170,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, 6.2832); ctx.fill();
    } else {
      e.rot += e.vr * dt;
      var s = e.s;
      ctx.globalAlpha = 1 - p; ctx.fillStyle = "#ffd9a8";
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(e.rot) * s, e.y + Math.sin(e.rot) * s);
      ctx.lineTo(e.x + Math.cos(e.rot + 2.3) * s * 0.8, e.y + Math.sin(e.rot + 2.3) * s * 0.8);
      ctx.lineTo(e.x + Math.cos(e.rot + 4.1) * s * 0.7, e.y + Math.sin(e.rot + 4.1) * s * 0.7);
      ctx.closePath(); ctx.fill();
    }
    return true;
  });
  ctx.globalAlpha = 1;
}

function frame(t) {
  var dt = Math.min(50, t - last) / 16.67; last = t;
  mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
  ctx.clearRect(0, 0, W, H);

  // nebula orbs (behind everything)
  orbs.forEach(function (o) {
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
    if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
    var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    g.addColorStop(0, "rgba(" + o.c + "," + o.a + ")"); g.addColorStop(1, "rgba(" + o.c + ",0)");
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.2832); ctx.fill();
  });

  // fixed stars
  stars.forEach(function (s) {
    ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t / 1000 * s.s + s.p));
    ctx.fillStyle = "#fff";
    if (s.big) { ctx.shadowColor = "#bcd4ff"; ctx.shadowBlur = 8; } else { ctx.shadowBlur = 0; }
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
  });

  // drifting dust with mouse parallax
  parts.forEach(function (p) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
    if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
    var px = p.x + mx * p.d * 40, py = p.y + my * p.d * 40;
    ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 1400 + p.p));
    ctx.fillStyle = p.warm ? "#ffe0bd" : "#cfe3ff";
    if (p.r > 1.1) { ctx.shadowColor = p.warm ? "#ffc78a" : "#8fc0ff"; ctx.shadowBlur = 6; } else { ctx.shadowBlur = 0; }
    ctx.beginPath(); ctx.arc(px, py, p.r, 0, 6.2832); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // sparkles
  sparks.forEach(function (k) { sparkle(k.x, k.y, k.s, 0.65 + 0.35 * Math.sin(t / 900 + k.p)); });

  // asteroids + explosions
  updateRocks(dt, t);
  rocks.forEach(drawRock);
  frags.forEach(drawRock);
  drawFx(dt);

  // shooting stars: frequent, can overlap, slower fade so they stay visible longer
  if (t > nextMeteor && meteors.length < 9) {
    meteors.push({ x: rnd(W * 0.3, W * 1.05), y: rnd(-20, H * 0.45), l: rnd(160, 300), sp: rnd(6, 10), life: 0, w: rnd(1.4, 2.4) });
    nextMeteor = t + rnd(400, 1400);
  }
  meteors = meteors.filter(function (m) {
    m.x -= 0.8 * m.sp * dt; m.y += 0.6 * m.sp * dt; m.life += dt / 140;
    var fade = m.life < 0.15 ? m.life / 0.15 : Math.max(0, 1 - (m.life - 0.15) / 0.85);
    var tx2 = m.x + 0.8 * m.l, ty2 = m.y - 0.6 * m.l;
    var lg = ctx.createLinearGradient(m.x, m.y, tx2, ty2);
    lg.addColorStop(0, "rgba(255,255,255," + fade + ")");
    lg.addColorStop(0.3, "rgba(170,210,255," + (fade * 0.45) + ")");
    lg.addColorStop(1, "rgba(120,170,255,0)");
    ctx.globalAlpha = 1; ctx.strokeStyle = lg; ctx.lineWidth = m.w; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(160,200,255," + fade + ")"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx2, ty2); ctx.stroke();
    ctx.shadowBlur = 0;
    return m.life < 1 && m.x > -80 && m.y < H + 80;
  });

  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}
addEventListener("resize", function () { resize(); initRocks(); });
addEventListener("pointermove", function (e) { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5; });
resize(); initRocks(); requestAnimationFrame(frame);