// ---------- Shared: nav highlight ----------
(function(){
  const current = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll("nav a.pill").forEach(a => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
})();

// ---------- Shared: helpers ----------
function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function setLS(key, val){ localStorage.setItem(key, String(val)); }
function getLS(key, fallback=null){
  const v = localStorage.getItem(key);
  return v === null ? fallback : v;
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function gcd(a,b){
  a=Math.abs(a); b=Math.abs(b);
  while(b) [a,b]=[b,a%b];
  return a||1;
}
function simpFrac(n,d){
  const g=gcd(n,d); n/=g; d/=g;
  if(d<0){n*=-1; d*=-1;}
  return {n,d};
}
function parseUserNumber(s){
  const t=(s||"").trim();
  if(!t) return null;
  if(t.includes("/")){
    const parts=t.split("/");
    if(parts.length!==2) return null;
    const n=Number(parts[0].trim()), d=Number(parts[1].trim());
    if(!Number.isFinite(n)||!Number.isFinite(d)||d===0) return null;
    return n/d;
  }
  const v=Number(t);
  return Number.isFinite(v) ? v : null;
}
function close(a,b){ return Math.abs(a-b) < 1e-6; }
function ordinal(n){
  if(n===1) return "st";
  if(n===2) return "nd";
  if(n===3) return "rd";
  return "th";
}

// ---------- Topics / Lessons ----------
const TOPICS = [
  { id:"addsub", name:"Add & Subtract", min:1, max:8, tip:"Line numbers up. Borrow/carry when needed." },
  { id:"place",  name:"Place Value", min:1, max:4, tip:"Ones, tens, hundreds… each place is 10× bigger." },
  { id:"multdiv",name:"Multiply & Divide", min:3, max:8, tip:"Multiplication is repeated addition. Division shares equally." },
  { id:"fractions",name:"Fractions", min:3, max:8, tip:"Same denominator? Add numerators. Different? Make common denominators." },
  { id:"decimals",name:"Decimals", min:4, max:8, tip:"Line up decimal points. Add zeros if you need to." },
  { id:"percent", name:"Percents", min:5, max:8, tip:"Percent means ‘out of 100’. 25% = 25/100 = 0.25." },
  { id:"integers",name:"Integers", min:6, max:8, tip:"Negative numbers are below 0. Watch signs when adding/subtracting." },
  { id:"ratios",  name:"Ratios & Rates", min:6, max:8, tip:"A:B compares amounts. Equivalent ratios scale both numbers." },
  { id:"algebra", name:"Algebra (Solve for x)", min:5, max:8, tip:"Do the same thing to both sides. Undo + then ×." },
];
function topicsForGrade(g){ return TOPICS.filter(t => g>=t.min && g<=t.max); }

// ---------- Practice generator ----------
function rangesForGrade(g){
  if(g<=2) return {add:20, sub:20, mult:0, div:0};
  if(g<=4) return {add:100, sub:100, mult:12, div:12};
  if(g<=6) return {add:500, sub:500, mult:20, div:20};
  return {add:1000, sub:1000, mult:25, div:25};
}

function makeProblem(grade, topic){
  const r = rangesForGrade(grade);

  if(topic==="place"){
    const max = grade<=1 ? 999 : 9999;
    const n = randInt(10, max);
    const place = grade<=2 ? ["ones","tens","hundreds"][randInt(0,2)]
                           : ["ones","tens","hundreds","thousands"][randInt(0,3)];
    const digit = (place==="ones") ? (n % 10)
      : (place==="tens") ? (Math.floor(n/10) % 10)
      : (place==="hundreds") ? (Math.floor(n/100) % 10)
      : (Math.floor(n/1000) % 10);
    return { text:`What is the ${place} digit in ${n}?`, answer: digit,
      hint:"Ones is rightmost, then tens, hundreds, thousands…" };
  }

  if(topic==="addsub"){
    const max = r.add;
    const a = randInt(0, max);
    const b = randInt(0, max);
    const op = (grade<=1) ? "+" : (Math.random()<0.5?"+":"−");
    if(op==="+") return { text:`${a} + ${b} = ?`, answer:a+b, hint:"Count on, or add in columns." };
    return { text:`${a} − ${b} = ?`, answer:a-b, hint:"Think: what plus b makes a?" };
  }

  if(topic==="multdiv"){
    const max = r.mult || 12;
    const a = randInt(0, max);
    const b = randInt(0, max);
    const op = (grade<=3) ? "×" : (Math.random()<0.5?"×":"÷");
    if(op==="×") return { text:`${a} × ${b} = ?`, answer:a*b, hint:"Use groups or skip-counting." };
    const d = randInt(1, max);
    const q = randInt(0, max);
    const n = d*q;
    return { text:`${n} ÷ ${d} = ?`, answer:q, hint:"How many groups of d are in n?" };
  }

  if(topic==="fractions"){
    const hard = grade>=5;
    let d1 = randInt(2, hard ? 12 : 10);
    let d2 = hard ? randInt(2, 12) : d1;
    if(!hard) d2 = d1;
    const n1 = randInt(1, d1-1);
    const n2 = randInt(1, d2-1);
    const op = Math.random()<0.5?"+":"−";

    const A = simpFrac(n1,d1);
    const B = simpFrac(n2,d2);

    const denom = (A.d===B.d) ? A.d : (A.d*B.d);
    const aNum = (denom/A.d)*A.n;
    const bNum = (denom/B.d)*B.n;
    const num = op==="+" ? (aNum+bNum) : (aNum-bNum);
    const simp = simpFrac(num, denom);

    return {
      text: `${A.n}/${A.d} ${op} ${B.n}/${B.d} = ? (fraction or decimal)`,
      answer: simp.n/simp.d,
      exact: `${simp.n}/${simp.d}`,
      hint: (A.d===B.d) ? "Same denominator: keep it, add/subtract numerators."
                        : "Make a common denominator, then add/subtract."
    };
  }

  if(topic==="decimals"){
    const places = grade<=4 ? 1 : 2;
    const a = randInt(0, 200) / (10**places);
    const b = randInt(0, 200) / (10**places);
    const op = Math.random()<0.5?"+":"−";
    const ans = op==="+" ? a+b : a-b;
    return { text:`${a.toFixed(places)} ${op} ${b.toFixed(places)} = ?`,
      answer:Number(ans.toFixed(places)),
      hint:"Line up decimal points (add zeros if needed)." };
  }

  if(topic==="percent"){
    const p = [10,20,25,50,75][randInt(0,4)];
    const base = randInt(10, 200);
    return { text:`What is ${p}% of ${base}?`, answer: base*(p/100),
      hint:"Multiply by p/100. Example: 25% = 0.25." };
  }

  if(topic==="integers"){
    const a = randInt(-20,20);
    const b = randInt(-20,20);
    const op = Math.random()<0.5?"+":"−";
    return { text:`${a} ${op} ${b} = ?`, answer: (op==="+")?a+b:a-b,
      hint:"Subtracting a negative becomes adding." };
  }

  if(topic==="ratios"){
    const a = randInt(1,12);
    const b = randInt(1,12);
    const scale = randInt(2,6);
    return {
      text: `If the ratio is ${a}:${b}, give an equivalent ratio with first number ${a*scale}. (Answer x:y)`,
      answer: null,
      hint: "Multiply BOTH numbers by the same number.",
      checker: (input) => {
        const t=(input||"").trim();
        const parts=t.split(":").map(s=>s.trim());
        if(parts.length!==2) return false;
        const x=Number(parts[0]), y=Number(parts[1]);
        if(!Number.isFinite(x)||!Number.isFinite(y)) return false;
        return close(x, a*scale) && close(y, b*scale);
      },
      displayAnswer: `${a*scale}:${b*scale}`
    };
  }

  const A = randInt(1, grade>=7 ? 12 : 8);
  const x = randInt(-10, 10);
  const b = randInt(-20, 20);
  const c = A*x + b;
  return { text:`Solve: ${A}x + ${b} = ${c}.  x = ?`, answer:x,
    hint:"Undo +b first (subtract b), then divide by A." };
}

// ---------- Glossary ----------
const GLOSSARY = [
  { term:"Add", cat:"Operations", def:"To put together and find the total." , example:"7 + 5 = 12" },
  { term:"Subtract", cat:"Operations", def:"To take away or find the difference.", example:"10 − 6 = 4" },
  { term:"Multiply", cat:"Operations", def:"Repeated addition; groups of the same size.", example:"3 × 4 = 12" },
  { term:"Divide", cat:"Operations", def:"Split into equal groups.", example:"12 ÷ 3 = 4" },
  { term:"Place Value", cat:"Numbers", def:"The value of a digit based on its position.", example:"In 352, the 5 means 50." },
  { term:"Fraction", cat:"Fractions", def:"A part of a whole. Written like a/b.", example:"3/4 means 3 parts out of 4." },
  { term:"Denominator", cat:"Fractions", def:"Bottom number of a fraction; how many equal parts.", example:"In 3/8, 8 is the denominator." },
  { term:"Numerator", cat:"Fractions", def:"Top number of a fraction; how many parts you have.", example:"In 3/8, 3 is the numerator." },
  { term:"Decimal", cat:"Decimals", def:"A number using a decimal point.", example:"0.5 means half." },
  { term:"Percent", cat:"Percents", def:"Out of 100.", example:"25% = 25/100 = 0.25" },
  { term:"Integer", cat:"Integers", def:"Whole numbers and their negatives, including 0.", example:"… −2, −1, 0, 1, 2 …" },
  { term:"Ratio", cat:"Ratios", def:"Compares two amounts.", example:"2:3 means 2 for every 3." },
  { term:"Variable", cat:"Algebra", def:"A letter that stands for a number.", example:"x + 2 = 7" },
  { term:"Equation", cat:"Algebra", def:"A math sentence that says two things are equal.", example:"3x = 12" },
];

// ---------- Page initializers ----------
document.addEventListener("DOMContentLoaded", () => {
  const g = qs("grade");
  if (g && Number(g)>=1 && Number(g)<=8) setLS("grade", g);
  if (!getLS("grade")) setLS("grade", "3");
  if (!getLS("stars")) setLS("stars", "0");

  initGradesPage();
  initPracticePage();
  initGamesPage();
  initLessonsPage();
  initWorksheetsPage();
  initGlossaryPage();
});

// Grades
function initGradesPage(){
  const grid = document.getElementById("gradeGrid");
  if(!grid) return;
  const currentGrade = Number(getLS("grade","3"));
  const label = document.getElementById("currentGradeText");
  if(label) label.textContent = `Current grade: ${currentGrade}${ordinal(currentGrade)}`;
  grid.innerHTML = "";
  for(let g=1; g<=8; g++){
    const card = document.createElement("a");
    card.className = "card";
    card.href = `practice.html?grade=${g}`;
    card.innerHTML = `<div class="tag">Grade</div><h3>${g}${ordinal(g)} Grade</h3><p>Practice topics picked for grade ${g}.</p>`;
    card.addEventListener("click", () => setLS("grade", String(g)));
    grid.appendChild(card);
  }
}

// Practice
function initPracticePage(){
  const gradeSel = document.getElementById("grade");
  const topicSel = document.getElementById("topic");
  if(!gradeSel || !topicSel) return;

  const okEl = document.getElementById("ok");
  const noEl = document.getElementById("no");
  const streakEl = document.getElementById("streak");
  const starsEl = document.getElementById("stars");
  const starBar = document.getElementById("starBar");

  const problemBox = document.getElementById("problemBox");
  const answer = document.getElementById("answer");
  const feedback = document.getElementById("feedback");
  const progress = document.getElementById("progress");

  const btnNew = document.getElementById("newSet");
  const btnHint = document.getElementById("hintBtn");
  const btnSkip = document.getElementById("skipBtn");
  const btnCheck = document.getElementById("checkBtn");
  const countSel = document.getElementById("count");

  let state = { list:[], idx:0, current:null, ok:0, no:0, streak:0, stars:Number(getLS("stars","0")), starBucket:0 };

  function updateScoreUI(){
    okEl.textContent = state.ok;
    noEl.textContent = state.no;
    streakEl.textContent = state.streak;
    starsEl.textContent = state.stars;
    starBar.textContent = "★".repeat(state.starBucket) + "☆".repeat(5-state.starBucket);
    setLS("stars", String(state.stars));
  }

  function refreshTopicOptions(){
    const g = Number(gradeSel.value);
    const options = topicsForGrade(g);
    topicSel.innerHTML = options.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    if (g <= 2) topicSel.value = "addsub";
    else if (g <= 4) topicSel.value = "multdiv";
    else topicSel.value = "algebra";
    setLS("grade", String(g));
    setLS("topic", String(topicSel.value));
  }

  function renderProblem(){
    if(!state.current){
      problemBox.textContent = "All done! 🎉 Press “New Set” to practice more.";
      progress.textContent = `${state.list.length}/${state.list.length}`;
      return;
    }
    problemBox.textContent = state.current.text;
    progress.textContent = `${state.idx+1}/${state.list.length}`;
  }

  function startSet(){
    const g = Number(gradeSel.value);
    const topic = topicSel.value;
    const count = Number(countSel.value) || 10;
    state.list = Array.from({length: count}, () => makeProblem(g, topic));
    state.idx = 0; state.current = state.list[0];
    feedback.textContent = "You got this! 🙌";
    renderProblem();
    answer.value = ""; answer.focus();
  }

  function levelUpIfNeeded(){
    if(state.starBucket >= 5){
      state.stars += 1;
      state.starBucket = 0;
      feedback.textContent = "⭐ Star earned! Awesome!";
    }
  }

  function nextProblem(){
    state.idx += 1;
    if(state.idx >= state.list.length){ state.current = null; renderProblem(); return; }
    state.current = state.list[state.idx];
    renderProblem();
    answer.value = ""; answer.focus();
  }

  function showHint(){
    if(!state.current) return;
    feedback.textContent = "Hint: " + (state.current.hint || "Try smaller steps.");
  }

  function skip(){
    if(!state.current) return;
    feedback.textContent = "Skipped. Next one!";
    state.streak = 0; state.starBucket = 0;
    updateScoreUI();
    nextProblem();
  }

  function checkAnswer(){
    if(!state.current) return;
    const raw = answer.value.trim();
    if(!raw){ feedback.textContent = "Type an answer first 🙂"; return; }

    let correct = false;
    if(state.current.checker) correct = state.current.checker(raw);
    else {
      const user = parseUserNumber(raw);
      if(user === null){ feedback.textContent = "Try a number… or 3/4 🙂"; return; }
      correct = close(user, state.current.answer);
    }

    if(correct){
      state.ok++; state.streak++; state.starBucket++;
      feedback.textContent = (state.streak % 5 === 0) ? "🔥 Big streak!" : "✅ Correct!";
      levelUpIfNeeded();
    } else {
      state.no++; state.streak = 0; state.starBucket = 0;
      const show = state.current.displayAnswer ? state.current.displayAnswer
        : (state.current.exact ? `${state.current.exact} (≈ ${state.current.answer})` : `${state.current.answer}`);
      feedback.textContent = `❌ Not quite. Answer: ${show}`;
    }

    updateScoreUI();
    nextProblem();
  }

  const storedGrade = Number(getLS("grade","3"));
  gradeSel.value = String(storedGrade);
  refreshTopicOptions();
  const storedTopic = getLS("topic", null);
  if(storedTopic){
    const possible = topicsForGrade(storedGrade).map(t=>t.id);
    if(possible.includes(storedTopic)) topicSel.value = storedTopic;
  }

  gradeSel.addEventListener("change", refreshTopicOptions);
  topicSel.addEventListener("change", () => setLS("topic", topicSel.value));

  btnNew.onclick = startSet;
  btnHint.onclick = showHint;
  btnSkip.onclick = skip;
  btnCheck.onclick = checkAnswer;
  answer.addEventListener("keydown", (e) => { if(e.key === "Enter") checkAnswer(); });

  updateScoreUI();
}

// Games
function initGamesPage(){
  const gameBox = document.getElementById("gameBox");
  if(!gameBox) return;

  const gradeSel = document.getElementById("g_grade");
  const topicSel = document.getElementById("g_topic");
  const timeSel = document.getElementById("g_time");
  const startBtn = document.getElementById("g_start");
  const stopBtn = document.getElementById("g_stop");
  const qEl = document.getElementById("g_question");
  const aEl = document.getElementById("g_answer");
  const statusEl = document.getElementById("g_status");
  const scoreEl = document.getElementById("g_score");
  const timerEl = document.getElementById("g_timer");

  let running=false, score=0, remaining=0, tick=null, current=null;

  function refreshTopics(){
    const g = Number(gradeSel.value);
    const options = topicsForGrade(g);
    topicSel.innerHTML = options.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    if(g<=2) topicSel.value="addsub";
    else if(g<=4) topicSel.value="multdiv";
    else topicSel.value="algebra";
  }

  function newQ(){
    const g = Number(gradeSel.value);
    const topic = topicSel.value;
    current = makeProblem(g, topic);
    qEl.textContent = current.text;
    aEl.value = "";
    aEl.focus();
  }

  function setUI(){ scoreEl.textContent=String(score); timerEl.textContent=String(remaining); }

  function stop(){
    running=false;
    clearInterval(tick); tick=null;
    statusEl.textContent="Game over! Try again?";
    qEl.textContent="—"; aEl.value="";
    setUI();
  }

  function start(){
    running=true; score=0;
    remaining = Number(timeSel.value) || 60;
    statusEl.textContent="Go! Answer as many as you can!";
    setUI(); newQ();
    clearInterval(tick);
    tick=setInterval(()=>{
      remaining -= 1;
      setUI();
      if(remaining <= 0) stop();
    }, 1000);
  }

  function check(){
    if(!running || !current) return;
    const raw=aEl.value.trim();
    if(!raw) return;

    let ok=false;
    if(current.checker) ok=current.checker(raw);
    else {
      const user=parseUserNumber(raw);
      if(user !== null) ok=close(user, current.answer);
    }

    statusEl.textContent = ok ? "✅ Nice!" : "❌ Next one!";
    if(ok) score += 1;
    newQ(); setUI();
  }

  gradeSel.value = getLS("grade","3");
  refreshTopics();
  gradeSel.addEventListener("change", refreshTopics);
  startBtn.onclick=start;
  stopBtn.onclick=stop;
  aEl.addEventListener("keydown",(e)=>{ if(e.key==="Enter") check(); });
}

// Lessons
function initLessonsPage(){
  const grid = document.getElementById("lessonGrid");
  if(!grid) return;

  const gradeSel = document.getElementById("l_grade");
  const current = Number(getLS("grade","3"));
  gradeSel.value = String(current);

  function render(){
    const g = Number(gradeSel.value);
    setLS("grade", String(g));
    const list = topicsForGrade(g);
    grid.innerHTML = "";
    list.forEach(t => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.cursor = "default";
      card.innerHTML = `
        <div class="tag">Lesson</div>
        <h3>${t.name}</h3>
        <p><strong>Tip:</strong> ${t.tip}</p>
        <p class="mono" style="margin-top:6px; opacity:0.9;">
          <a href="practice.html?grade=${g}" style="text-decoration:underline;">Practice this grade</a>
        </p>
      `;
      grid.appendChild(card);
    });
    const tip = document.getElementById("lessonTip");
    if(tip) tip.textContent = `Showing lessons for grade ${g}${ordinal(g)}.`;
  }

  gradeSel.addEventListener("change", render);
  render();
}

// Worksheets
function initWorksheetsPage(){
  const out = document.getElementById("ws_out");
  if(!out) return;

  const gradeSel = document.getElementById("ws_grade");
  const topicSel = document.getElementById("ws_topic");
  const countSel = document.getElementById("ws_count");
  const btnGen = document.getElementById("ws_gen");
  const btnPrint = document.getElementById("ws_print");

  gradeSel.value = getLS("grade","3");

  function refreshTopics(){
    const g = Number(gradeSel.value);
    setLS("grade", String(g));
    const options = topicsForGrade(g);
    topicSel.innerHTML = options.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    if (g <= 2) topicSel.value = "addsub";
    else if (g <= 4) topicSel.value = "multdiv";
    else topicSel.value = "algebra";
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function renderWorksheet(){
    const g = Number(gradeSel.value);
    const topic = topicSel.value;
    const count = Number(countSel.value) || 20;
    const problems = Array.from({length: count}, () => makeProblem(g, topic));
    const title = `Worksheet • Grade ${g}${ordinal(g)} • ${TOPICS.find(t=>t.id===topic)?.name || topic}`;
    const date = new Date().toLocaleDateString();

    out.innerHTML = `
      <div class="printCard">
        <h2 style="margin:0 0 6px;">${title}</h2>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <div>Name: ____________________</div>
          <div>Date: ${date}</div>
        </div>

        <div class="printGrid">
          ${problems.map((p,i)=>`
            <div style="border:1px solid rgba(0,0,0,0.15); padding:10px;">
              <div style="font-weight:600;">${i+1}. <span class="mono">${escapeHtml(p.text.replace("= ?", "= ____"))}</span></div>
              <div style="margin-top:16px;">Answer: ____________________</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    out.dataset.key = JSON.stringify(problems.map(p => p.displayAnswer || p.exact || p.answer));
  }

  btnGen.onclick = renderWorksheet;
  btnPrint.onclick = () => window.print();
  gradeSel.addEventListener("change", () => { refreshTopics(); renderWorksheet(); });
  topicSel.addEventListener("change", renderWorksheet);
  countSel.addEventListener("change", renderWorksheet);

  refreshTopics();
  renderWorksheet();
}

// Glossary
function initGlossaryPage(){
  const listEl = document.getElementById("gl_list");
  if(!listEl) return;

  const qEl = document.getElementById("gl_q");
  const chipsEl = document.getElementById("gl_chips");

  const cats = Array.from(new Set(GLOSSARY.map(x => x.cat))).sort();
  let activeCat = "All";

  function renderChips(){
    chipsEl.innerHTML = "";
    const all = document.createElement("button");
    all.className = "chip";
    all.textContent = "All";
    all.onclick = () => { activeCat="All"; render(); };
    chipsEl.appendChild(all);

    cats.forEach(c => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = c;
      b.onclick = () => { activeCat=c; render(); };
      chipsEl.appendChild(b);
    });
  }

  function render(){
    const q = (qEl.value || "").trim().toLowerCase();
    const items = GLOSSARY.filter(x => {
      const inCat = (activeCat==="All") || (x.cat===activeCat);
      if(!inCat) return false;
      if(!q) return true;
      const hay = (x.term+" "+x.def+" "+x.example+" "+x.cat).toLowerCase();
      return hay.includes(q);
    });

    const title = document.getElementById("gl_title");
    if(title) title.textContent = `Showing: ${activeCat} (${items.length})`;

    listEl.innerHTML = items.map(x => `
      <div class="card" style="grid-column: span 6; cursor: default;">
        <div class="tag">${x.cat}</div>
        <h3>${x.term}</h3>
        <p>${x.def}</p>
        <p class="mono" style="margin-top:6px; opacity:0.9;"><strong>Example:</strong> ${x.example}</p>
      </div>
    `).join("");

    if(items.length===0){
      listEl.innerHTML = `<div class="bigBox" style="grid-column: span 12;">No matches. Try a different word.</div>`;
    }
  }

  qEl.addEventListener("input", render);
  renderChips();
  render();
}
