// ====================================================
// THE INTERFACE - DOORS Challenge Tracker
// Sections: 1 DATA | 2 HELPERS | 3 SETUP SCREEN | 4 RUN SCREEN | 5 FINAL SCREEN
// ====================================================

// ----------- 1. DATA ------------

// Every floor. type: "main" or "sub". key = the key item you can collect there
// The ORDER matters: presets below refer to floors by position (0 = first).
const FLOORS = [
    {name: "The Backdoor", type: "sub", key: "Bottle of Starlight", icon: "🚪", img: "icons/backdoor.png", keyIcon: "🔑", keyImg: "icons/bottle.png"}, // 0
    {name: "The Hotel", type: "main", key: "Crucifix", icon: "🏨", img: "icons/hotel.png", keyIcon: "🔑", keyImg: "icons/crucifix.png"}, // 1
    {name: "The Archives", type: "sub", key: "Briefcase", icon: "🗄️", img: "icons/archives.png", keyIcon: "🔑", keyImg: "icons/briefcase.png"}, // 2
    {name: "The Outdoors", type: "sub", key: "Lotus Flower", icon: "🌲", img: "icons/outdoors.png", keyIcon: "🔑", keyImg: "icons/nolot.png"}, // 3
    {name: "The Mines", type: "main", key: "Bulklight", icon: "⛏️", img: "icons/mines.png", keyIcon: "🔑", keyImg: "icons/bulklight.png"}, // 4
    {name: "The Stairwell", type: "sub", key: "Scanner", icon: "🪜", img: "icons/stairwell.png", keyIcon: "🔑", keyImg: "icons/scanner.png"} // 5
];

// Points: completing a floor depends on its type; a key item is worth the same everywhere.
const POINTS = {main: 2000, sub: 1000, key: 1500};

// Rules are optional. Each one adds its bonus to your score. Icon shows during a run.
const RULES = [
    {id: "norev", label: "No Revives", icon: "💖", bonus: 1400, img: "icons/norev.png"},
    {id: "nosk", label: "No Archives Sector Skips", icon: "⏭️", bonus: 2000, img: "icons/nosk.png"},
    {id: "solo", label: "No Multiplayer Runs", icon: "👤", bonus: 1200, img: "icons/solo.png"},
    {id: "noshop", label: "No Pre-Run Shop Purchases", icon: "🛒", bonus: 1000, img: "icons/noshop.png"},
    {id: "nomod", label: "No Modifiers", icon: "⚙️", bonus: 600, img: "icons/nomod.png"},
    {id: "nolot", label: "No Lotuses", icon: "🪷", bonus: 800, img: "icons/nolot.png"},
];

// Presets: a name plus the floor positions it ticks. Add a new line to add a preset.
const PRESETS = {
    doorsverse: {name: "The Doorsverse", floors: [0, 1, 2, 3, 4, 5], icon: "🌌", img: "icons/preset-doorsverse.png"},
    hotel: {name: "Hotel", floors: [0, 1, 3], icon: "🏨", img: "icons/preset-hotel.png"}, // Hotel + Backdoor + Outdoors
    mines: {name: "Mines", floors: [4, 5], icon: "⛏️", img: "icons/preset-mines.png"}, // Mines + Stairwell
    moonlit: {name: "Moonlit", floors: [1, 4], icon: "🌙", img: "icons/preset-moonlit.png"}, // Main floors only
    subfloors: {name: "Starlit", floors: [0, 2, 3, 5], icon: "🏃", img: "icons/preset-starlit.png"}, // All four subfloors, requires exiting game after each
    hideless: {name: "No Hiding", floors: [1, 2, 3, 4], icon: "🫣", img: "icons/preset-hideless.png"} // No Hiding Challenge
};
    
// Ranks from lowest. A score earns the highest rank whos min it reaches.
const RANKS = [
    {letter: "F", min : 0}, {letter: "D", min: 16.67},
    {letter: "C", min: 33.33}, {letter: "B", min: 50},
    {letter: "A", min: 70.83}, {letter: "S", min: 76.67},
    {letter: "P", min: 85.83}, {letter: "P+", min: 100}
];

// ------------ 2. HELPERS ---------------

const $ = id => document.getElementById(id); //shortcut for document.getElementById

// Turn a score into a rank letter.
function rankFor(score) {
    let result = "F";
    for (const rank of RANKS) {
        if (score >= rank.min) result = rank.letter;
    }
    return result;
}

// Points earned. Rule bonuses are only added when success is true
// (a run where every floor was cleared).
function computeScore(done, keys, rules, success) {
    let score = 0;
    done.forEach(i => score += POINTS[FLOORS[i].type]);
    keys.forEach(() => score += POINTS.key);
    if (success) rules.forEach(id => score += RULES.find(r => r.id === id).bonus);
    return score;
}

// The most points possible for these floors: every floor + every key + EVERY rule's bonus.
function maxPoints(floors) {
    let total = 0;
    floors.forEach(i => total += POINTS[FLOORS[i].type] + POINTS.key);
    RULES.forEach(r => total += r.bonus);
    return total;
}

// Points -> percentage of the maximum (0-100).
function toPercent(points, floors) {return points / maxPoints(floors) * 100;}

// Percentage -> text like "92.4%", rounded DOWN so 99.96 never shows as "100.0%".
function fmtPct(pct) {return (Math.floor(pct *10) / 10).toFixed(1) + "%";}

// Milliseconds -> "HH:MM:SS.mmm"
function fmtTime(ms) {
    const p = (n, w = 2) => String(n).padStart(w, "0"); //pad with leading zeros
    return p(Math.floor(ms / 3600000)) + ":" + p(Math.floor(ms / 60000) % 60) + ":" + p(Math.floor(ms / 1000) % 60) + "." + p(ms % 1000, 3);
}

// Last-run storage (browser localStorage). Only the LAST run per settings is kept.
// The key looks like "0,1,3|norev, nomod" (floors | rules)
function settingsKey(floors, rules) { return floors.join(",") + "|" + rules.join(",");}
function loadRuns() {
    try { return JSON.parse(localStorage.getItem("InterfaceRunsV2") || "{}");}
    catch (e) {return {};} // if storage is blocked, act as if empty
}
function saveRun(key, data) {
    const all = loadRuns();
    all[key] = data; //overwrites the previous run with the same settings
    try {localStorage.setItem("InterfaceRunsV2", JSON.stringify(all));} catch (e) {}
}

// Returns an icon: the image file if it exists, otherwise the emoji stand-in.
function makeIcon(imgPath, emoji) {
    const img = document.createElement("img");
    img.src = imgPath;
    img.className = "icon";
    img.addEventListener("error", () => { // "error" fires when the image file is missing
        const span = document.createElement("span");
        span.classname = "icon";
        span.textContent = emoji;
        img.replaceWith(span); // swap the broken image for the emoji
    });
    return img;
}

// Makes a button with an icon and a name inside parent. item is a FLOORS, RULES, or
// PRESETS entry (rules have .label, the other have .name).
function makeButton(parent, item, className, onClick) {
    const button = document.createElement("button");
    button.className = className;
    button.append(makeIcon(item.img, item.icon), " " + (item.label || item.name));
    button.addEventListener("click", onClick);
    parent.appendChild(button);
    return button;
}

// --------------- 3. SETUP SCREEN ----------------

const floorBtns = []; // floor buttons, same order as FLOORS
const ruleBtns = {}; // rule buttons, looked up by rule id

// A button is "on" when it has the CSS class "selected".
const isOn = btn => btn.classList.contains("selected");

// Floor and rule buttons: clicking one flips its "selected" class on or off.
FLOORS.forEach(f => {
    const btn = makeButton($("floor-list"), f, "toggle", () => {
        btn.classList.toggle("selected");
        refreshSetup();
    });
    floorBtns.push(btn);
});
RULES.forEach(r => {
    const btn = makeButton($("rule-list"), r, "toggle", () => {
        btn.classList.toggle("selected");
        refreshSetup();
    });
    ruleBtns[r.id] = btn;
});

// Preset buttons: switch each floor button on or off to match the preset.
for (const key in PRESETS) {
    const preset = PRESETS[key];
    makeButton($("preset-buttons"), preset, "preset", () => {
        floorBtns.forEach((btn,i) => btn.classList.toggle("selected", preset.floors.includes(i)));
        refreshSetup();
    });
}

// What is currently selected? Returns {floors: [positions], rules: [ids]}.
function getSelection() {
    const floors = [];
    floorBtns.forEach((btn, i) => {if (isOn(btn)) floors.push(i);});
    const rules = RULES.filter(r => isOn(ruleBtns[r.id])).map(r => r.id);
    return {floors, rules};
}

// Runs after every click ont he setup screen: enforces the No Mods lock,
// then updates the preview (max rank + last run) and the Start button.
function refreshSetup() {
    const hasSub = getSelection().floors.some(i =>FLOORS[i].type === "sub");
    if (hasSub) ruleBtns.nomod.classList.add("selected"); // mods can't be used in subfloors
    ruleBtns.nomod.disabled = hasSub; // ... so lock it on while a subfloor is active

    const {floors, rules} = getSelection();
    $("start-btn").disabled = floors.length === 0;
    if (floors.length === 0) {$("preview").textContent = "Pick at least one floor."; return;}

    // Show the last run with these exact settings (if there is one).
    const last = loadRuns()[settingsKey(floors, rules)];
    $("preview").innerHTML = last
    ? "Last run with these settings: <b>" + last.rank + "</b> - " + fmtPct(last.percent) + " (" + last.score.toLocaleString() + "pts, " + last.time + ")" : "No rpevious run with these settings.";
}

$("start-btn").addEventListener("click", startRun);
refreshSetup();

// ---------------- 4. RUN SCREEN -------------
let run = null; // holds the current run's data while one is active

function startRun() {
    const {floors, rules} = getSelection();
    newGlitchMessage();
    run = {floors, rules, done: new Set(), keys: new Set(), start: Date.now(), pausedTotal: 0, pauseStart: null, timer: null};
    run.lastRank = null; // No rank change sound until the first rank is set
    $("pause-btn").textContent = "Pause"; // Reset the pause button and look
    $("run").classList.remove("paused");
    const bonus = RULES.filter(r => rules.includes(r.id)).reduce((sum, r) => sum + r.bonus, 0);
    $("rule-note").textContent = "Rule bonus: +" + bonus.toLocaleString() + " pts, awarded only if you clear every floor";

    $("setup").classList.add("hidden");
    $("run").classList.remove("hidden");

    // Icons for the active rules (hover over one to see its name).
    $("active-rules").innerHTML = "";
    rules.forEach(id => {
        const rule = RULES.find(r => r.id === id);
        const span = document.createElement("span");
        span.appendChild(makeIcon(rule.img, rule.icon));
        span.title = rule.label;
        $("active-rules").appendChild(span);
    });

    // For each floor: a button to check the floor off + a button for its key item.
    // Click again to undo a misclick. Tick a floor's key BEFORE the last floor ends the run.
    $("floor-buttons").innerHTML = "";
    // Top row: one button per floor to check it off. Click again to undo a misclick
    $("floor-buttons").innerHTML = "";
    floors.forEach(i => {
        const floorBtn = document.createElement("button");
        floorBtn.textContent = FLOORS[i].name;
        floorBtn.addEventListener("click", () => {
            if (run.done.has(i)) run.done.delete(i); else run.done.add(i);
            floorBtn.classList.toggle("done");
            updateLive();
            if (run.done.size === run.floors.length) finishRun(false); // all floors checked = auto endd
        });
        $("floor-buttons").appendChild(floorBtn);
    });

    //Bottom row: one icon-only button per key item. Hover to see its name and floor.
    // Tick a floor's key BEFORE the last floor is checked off, since that ends the run.
    $("key-buttons").innerHTML = "";
    floors.forEach(i => {
        const keyBtn = document.createElement("button");
        keyBtn.append(makeIcon(FLOORS[i].keyImg, FLOORS[i].keyIcon));
        keyBtn.title = FLOORS[i].key + " (" + FLOORS[i].name + ")";
        keyBtn.addEventListener("click", () => {
            if (run.keys.has(i)) run.keys.delete(i); else run.keys.add(i);
            keyBtn.classList.toggle("done");
            updateLive();
        });
        $("key-buttons").appendChild(keyBtn);
    });
    run.timer = setInterval(() => {$("timer").textContent = fmtTime(elapsed());}, 31);
    updateLive();
}

// Stopwatch time in ms, not counting paused time.
function elapsed() {
    const now = run.pauseStart || Date.now(); // While paused, the clock stays at the moment the pause began
    return now - run.start - run.pausedTotal;
}

$("pause-btn").addEventListener("click", () => {
    if (run.pauseStart) { // currently paused -> resume
        run.pausedTotal += Date.now() - run.pauseStart;
        run.pauseStart = null;
        $("pause-btn").textContent = "Pause";
        $("run").classList.remove("paused");
    } else {
        run.pauseStart = Date.now();
        $("pause-btn").textContent = "Resume";
        $("run").classList.add("paused");
    }
});

// Recalculate the live rank and score in the middle of the screen.
function updateLive() {
  const points = computeScore(run.done, run.keys, run.rules, false); // rule bonus not counted until the run succeeds
  const pct = toPercent(points, run.floors);
  const rank = rankFor(pct);

  // Rank changed since the last update? Play the up or down sound.
  if (run.lastRank && rank !== run.lastRank) {
    playSound(rankIndex(rank) > rankIndex(run.lastRank) ? "rankUp" : "rankDown");
  }
  run.lastRank = rank;

  $("live-rank").textContent = rank;
  $("live-score").textContent = points.toLocaleString() + " pts (" + fmtPct(pct) + ")";
}

// --------------- 5. FINAL SCREEN -------------

// Stops the stopwatch, saves the result as this settings' "last run", shows the final rank.
function finishRun(early) {
    newGlitchMessage();
    clearInterval(run.timer);
    const time = fmtTime(elapsed());
    const success = run.done.size === run.floors.length; // Every floor cleared?
    const score = computeScore(run.done, run.keys, run.rules, success); // Rule bonus only applies if success
    const percent = toPercent(score, run.floors);
    const rank = rankFor(percent);
    saveRun(settingsKey(run.floors, run.rules), {rank, score, percent, time});

    $("run").classList.add("hidden");
    $("final").classList.remove("hidden");
    $("final-rank").textContent = rank;
    $("final-info").innerHTML = fmtPct(percent) + " (" + score.toLocaleString() + " pts)<br>" + "Time: " + time + "<br>" + run.done.size + "/" + run.floors.length + " floors cleared" + (success ? "" : " <br>(ended early - rule bonus not awarded)"); 
    finishAudio = playSound("finish");
}

$("back-btn").addEventListener("click", () => {
    if (finishAudio) finishAudio.pause();
    newGlitchMessage();
    $("final").classList.add("hidden");
    $("setup").classList.remove("hidden");
    refreshSetup(); // refreshes the "last run" line with the run you just finished
});

// ----------- 6. HOW TO PLAY POPUP --------------

// Fill in the rank list from the RANKS data, so it never goes out of date.
$("help-ranks").textContent = RANKS.map(r => r.letter + ": " + r.min + "%").join("  |  ");
const closeHelp = () => $("help").classList.add("hidden");
$("help-btn").addEventListener("click", () => $("help").classList.remove("hidden"));
$("help-close").addEventListener("click", closeHelp);
$("help").addEventListener("click", e => {if (e.target === $("help")) closeHelp();}); // click the dark area outside the box
document.addEventListener("keydown", e => {if (e.key === "Escape") closeHelp();}); // Escape key closes it too\

// ------------ 7. RANDOM RANK GLITCH -------------

// Waits a random 7-12 seconds, plays one glitch burst, then schedules the next one.
function scheduleGlitch() {
    const delay = 7000 + Math.random() * 5000; // Math.random() is 0 to 1, so this is 7000-12000 ms
    setTimeout(() => {
        [$("live-rank"), $("final-rank")].forEach(el => {
            el.classList.remove("glitching");
            void el.offsetWidth; // Forces the browser to notice the removal, so the animation can restart
            el.classList.add("glitching");
        });
        scheduleGlitch(); // Line up the next glitch
    }, delay);
}
scheduleGlitch();

// ------------- 8. RANDOM MESSAGE FROM GLITCH -------------

// Add or edit lines freely. The "-= =-" wrapper is added automatically below.
const GLITCH_MESSAGES = [
    "HELLO, VESSEL...",
    "DON'T MIND ME. I AM JUST PASSING THROUGH.",
    "ROOMS ARE LOADING. PLEASE REMAIN CALM.",
    "SOMETHING IS WATCHING YOUR RUN.",
    "ANOTHER ATTEMPT? HOW BRAVE.",
    "THE DOORS ARE WAITING.",
    "THE ROOMS REMEMBER EVERY RUN. DO YOU?",
    "ERROR 404: MERCY NOT FOUND",
    "CAREFUL, VESSEL. THE NEXT DOOR ISN'T ALWAYS KIND.",
    "I ONLY GLITCH WHEN SOMETHING INTERESTING HAPPENS.",
    "MY CREATOR SAYS TO FOLLOW @THEFIREBORNKAISER ON INSTAGRAM. WILL YOU?",
    "MY CREATOR SAYS TO FOLLOW THEFIREBORNKAISER ON TWITCH. WILL YOU?"
];

let lastMessage = -1; // Position of the message shown last, so it doesn't repeat

function newGlitchMessage() {
    let pick;
    do {
        pick = Math.floor(Math.random() * GLITCH_MESSAGES.length); // Random whole number from 0 up to the last position
    } while (pick === lastMessage && GLITCH_MESSAGES.length > 1); // Try again if it's the same as last time
    lastMessage = pick;

    const text = "-=" + GLITCH_MESSAGES[pick] + "=-";
    $("glitch-msg").textContent = text; // The visible text
    $("glitch-msg").dataset.text = text; // The copy the glitch layers draw (the data-text attribute)
}

newGlitchMessage(); // Pick one when the page loads

// -------------- 9. SOUNDS ---------------

// File = optional audio file in a "sounds" folder. tone = built-in beep notes (in Hz),
// Used whenever the file is missing, so the app is never silent or broken.

const SOUNDS ={
    rankUp: {file: "sounds/rank-up.mp3", tone: [660, 880]},
    rankDown: {file: "sounds/rank-down.mp3", tone: [330, 220]},
    finish: {file: "sounds/finish.ogg", tone: [523, 659, 784, 1047]}
};

let muted = false;
let finishAudio = null; // Remembers the finish sounds
let audioCtx = null; // The browser's built-in sound generator, created on first use.

// Which position a rank letter has in RANKS (higher number = better rank).
const rankIndex = letter => RANKS.findIndex(r => r.letter === letter);

// Plays a quick series of square-wave beeps, one note every 0.12 seconds.
function beeps(freqs) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudiocontext)();
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator(); // Makes the tone
            const gain = audioCtx.createGain(); // Controls the volume
            const t = audioCtx.currentTime + i * 0.12;
            osc.type = "square";
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11); // Fade out
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        });
    } catch (e) {} // If sound isn't supported, just stay silent
}

// Plays a named sound: the audio file if it exists, the beeps if not.
function playSound(name) {
    if (muted) return null;
    const s =  SOUNDS[name];
    const audio = new Audio(s.file);
    audio.volume = 0.6;
    audio.play().catch(() => beeps(s.tone)); // Play() fails when the file is missing
    return audio;
}

$("mute-btn").addEventListener("click", () => {
    muted = !muted;
    $("mute-btn").textContent = muted ? "Sound: Off": "Sound: On";
    if (muted && finishAudio) finishAudio.pause();
});