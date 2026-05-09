// ── Line numbers ──
const editor = document.getElementById("editor");
const lineNumbers = document.getElementById("lineNumbers");

function updateLineNumbers() {
const lines = editor.value.split("\n").length;
lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join("<br>");
}

editor.addEventListener("input", updateLineNumbers);
editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });
updateLineNumbers();

// ── Assemble ──
async function assemble() {
const code = editor.value.trim();
if (!code) return;

const btn = document.getElementById("btnAssemble");
btn.textContent = "Processing...";
btn.classList.add("loading");
document.getElementById("toolbarInfo").textContent = "Assembling...";

try {
    const res  = await fetch("/assemble", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
    renderOutput(data);
    document.getElementById("statStatus").textContent = "success";
    document.getElementById("statStatus").style.color = "var(--accent2)";
    document.getElementById("outBadge").textContent = "DONE";
    document.getElementById("toolbarInfo").textContent =
        `${data.output.length} instruction${data.output.length !== 1 ? "s" : ""} assembled`;
    } else {
    renderError(data.error);
    document.getElementById("statStatus").textContent = "error";
    document.getElementById("statStatus").style.color = "var(--red)";
    document.getElementById("outBadge").textContent = "ERROR";
    document.getElementById("toolbarInfo").textContent = "Assembly failed";
    }
} catch (e) {
    renderError("Could not connect to assembler server.");
}

btn.textContent = "▶ Assemble";
btn.classList.remove("loading");
}

function renderOutput(data) {
document.getElementById("statInstr").textContent   = data.output.length;
document.getElementById("statSymbols").textContent = Object.keys(data.symbol_table).length;

let html = "";

// Symbol table
if (Object.keys(data.symbol_table).length > 0) {
    html += `<div class="symbol-section">
    <div class="section-label">Symbol table</div>
    <div class="symbol-pills">`;
    for (const [name, addr] of Object.entries(data.symbol_table)) {
    html += `<div class="symbol-pill">
        <span class="sym-name">${name}</span>
        <span class="sym-addr">: ${addr.toString(16).toUpperCase().padStart(3,"0")}</span>
    </div>`;
    }
    html += `</div></div>`;
}

// Machine code table
html += `<div class="section-label">Machine code</div>
<table class="out-table">
    <thead>
    <tr>
        <th>Addr</th>
        <th>Binary (opcode · operand)</th>
        <th>Hex</th>
    </tr>
    </thead>
    <tbody>`;

data.output.forEach(row => {
    const op   = row.binary.slice(0, 4);
    const addr = row.binary.slice(4);
    html += `<tr>
    <td class="td-addr">${row.address}</td>
    <td class="td-binary"><span class="op">${op}</span> <span class="addr-bits">${addr}</span></td>
    <td class="td-hex">${row.hex}</td>
    </tr>`;
});

html += `</tbody></table>`;

const wrap = document.getElementById("outputWrap");
wrap.innerHTML = html;
}

function renderError(msg) {
document.getElementById("statInstr").textContent   = "—";
document.getElementById("statSymbols").textContent = "—";
document.getElementById("outputWrap").innerHTML = `
    <div class="error-box">
    <div class="error-icon">✕</div>
    <div>${msg}</div>
    </div>`;
}

function clearAll() {
editor.value = "";
updateLineNumbers();
document.getElementById("outputWrap").innerHTML =
    document.getElementById("emptyState")?.outerHTML ||
    `<div class="empty-state"><div class="empty-label">Awaiting assembly</div></div>`;
document.getElementById("outBadge").textContent    = "WAITING";
document.getElementById("statInstr").textContent   = "—";
document.getElementById("statSymbols").textContent = "—";
document.getElementById("statStatus").textContent  = "idle";
document.getElementById("statStatus").style.color  = "";
document.getElementById("toolbarInfo").textContent = "Ready";
}

// Keyboard shortcut: Ctrl+Enter to assemble
editor.addEventListener("keydown", e => {
if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    assemble();
}
});