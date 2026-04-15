import React, { useState, useRef } from "react";
import CodeEditor from "./components/CodeEditor";
import CompareButton from "./components/CompareButton";
import Result from "./components/Result";
import DiffViewer from "./components/DiffViewer";
import photonLogo from "./assets_2/photon-logo.png";
import satelliteImg from "./assets_2/Sattelite_logo.png";

// ---------- helpers ----------

function computeAccuracy(originalCode, participantCode) {
    if (!originalCode || !participantCode) return "0.00";
    const orig = (originalCode || "").split(/\s+/).filter(Boolean);
    const usr = (participantCode || "").split(/\s+/).filter(Boolean);
    if (orig.length === 0) return "0.00";
    let match = 0;
    const maxLen = Math.max(orig.length, usr.length);
    for (let i = 0; i < maxLen; i++) {
        if (orig[i] && usr[i] && orig[i] === usr[i]) match++;
    }
    return ((match / orig.length) * 100).toFixed(2);
}

function parseCSV(text) {
    let cur = "";
    let inQuote = false;
    const lines = [];

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') { inQuote = !inQuote; cur += ch; }
        else if (ch === "\n" && !inQuote) { lines.push(cur); cur = ""; }
        else { cur += ch; }
    }
    if (cur.trim()) lines.push(cur);

    const splitRow = (row) => {
        const cells = [];
        let cell = "";
        let q = false;
        for (let i = 0; i < row.length; i++) {
            const c = row[i];
            if (c === '"') {
                if (q && row[i + 1] === '"') { cell += '"'; i++; }
                else q = !q;
            } else if (c === "," && !q) { cells.push(cell.trim()); cell = ""; }
            else { cell += c; }
        }
        cells.push(cell.trim());
        return cells;
    };

    return lines.filter(l => l.trim()).map(splitRow);
}

// ---------- component ----------

export default function App() {
    // "leaderboard" | "single"
    const [mode, setMode] = useState("leaderboard");

    const [original, setOriginal] = useState("");
    const [user, setUser] = useState("");
    const [accuracy, setAccuracy] = useState(0);
    const [diff, setDiff] = useState([]);

    const [csvFileName, setCsvFileName] = useState("");
    const [leaderboard, setLeaderboard] = useState([]);
    const [csvError, setCsvError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    // ---- single compare ----
    const compareCode = () => {
        const orig = original.split(/\s+/).filter(Boolean);
        const usr = user.split(/\s+/).filter(Boolean);
        let match = 0;
        let diffArr = [];
        const maxLen = Math.max(orig.length, usr.length);
        for (let i = 0; i < maxLen; i++) {
            if (orig[i] === usr[i]) { match++; diffArr.push({ word: orig[i], type: "correct" }); }
            else { diffArr.push({ word: usr[i] || "", type: "wrong" }); }
        }
        setAccuracy(((match / orig.length) * 100).toFixed(2));
        setDiff(diffArr);
    };

    // ---- CSV upload ----
    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith(".csv")) { setCsvError("❌ Please upload a valid .csv file."); return; }
        if (!original.trim()) { setCsvError("⚠️ Please paste the original code in the editor below first."); return; }

        setCsvError("");
        setIsProcessing(true);
        setCsvFileName(file.name);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const rows = parseCSV(ev.target.result);
                if (rows.length < 2) { setCsvError("❌ CSV is empty or has no data rows."); setIsProcessing(false); return; }

                const header = rows[0].map(h => h.replace(/^"|"$/g, "").trim());
                const nameIdx = header.findIndex(h => h.toLowerCase() === "name");
                const codeIdx = header.findIndex(h => h.toLowerCase() === "your code");

                if (nameIdx === -1) { setCsvError("❌ Could not find a 'Name' column."); setIsProcessing(false); return; }
                if (codeIdx === -1) { setCsvError("❌ Could not find a 'Your code' column."); setIsProcessing(false); return; }

                const entries = rows
                    .slice(1)
                    .filter(row => row.length > Math.max(nameIdx, codeIdx))
                    .map(row => {
                        const name = row[nameIdx].replace(/^"|"$/g, "").trim() || "(unknown)";
                        const participantCode = row[codeIdx].replace(/^"|"$/g, "").trim();
                        const accuracy = computeAccuracy(original, participantCode);

                        // Build diff array
                        const origWords = (original || "").split(/\s+/).filter(Boolean);
                        const usrWords = (participantCode || "").split(/\s+/).filter(Boolean);
                        const maxLen = Math.max(origWords.length, usrWords.length);
                        const diff = [];
                        for (let i = 0; i < maxLen; i++) {
                            if (origWords[i] === usrWords[i]) {
                                diff.push({ word: origWords[i], type: "correct" });
                            } else {
                                diff.push({ orig: origWords[i] || "", submitted: usrWords[i] || "", type: "wrong" });
                            }
                        }

                        return { name, accuracy, participantCode, diff };
                    })
                    .filter(e => e.name !== "(unknown)" || parseFloat(e.accuracy) > 0);

                entries.sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));
                setLeaderboard(entries);
            } catch (err) {
                setCsvError("❌ Failed to parse CSV: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (index) => {
        setExpandedRow(prev => (prev === index ? null : index));
    };

    const isLeaderboard = mode === "leaderboard";

    return (
        <>
            <img src={photonLogo} alt="Photon" className="neutron-logo" />

            {/* ── Mode Toggle Button ── */}
            <button
                className="mode-toggle-btn"
                onClick={() => setMode(isLeaderboard ? "single" : "leaderboard")}
            >
                {isLeaderboard
                    ? <><span className="mode-icon">⚖️</span> Single Compare</>
                    : <><span className="mode-icon">🏆</span> Leaderboard</>}
            </button>

            <div className="space-background">
                <img src={satelliteImg} className="satellite sat-1" alt="satellite" />
                <img src={satelliteImg} className="satellite sat-2" alt="satellite" />
                <img src={satelliteImg} className="satellite sat-3" alt="satellite" />
                <img src={satelliteImg} className="satellite sat-4" alt="satellite" />
                <img src={satelliteImg} className="satellite sat-5" alt="satellite" />
            </div>

            <div className="app">
                <h1>Strudel Code Comparator</h1>

                {/* ════════════ LEADERBOARD MODE ════════════ */}
                {isLeaderboard && (
                    <div className="mode-panel" key="leaderboard">
                        <div className="csv-section">
                            <p className="csv-hint">
                                Upload a CSV with columns <strong>Name</strong> and <strong>Your code</strong>.
                                Paste the original code in the <strong>Original Code</strong> box below first.
                            </p>

                            <div className="csv-upload-area" onClick={() => fileInputRef.current.click()}>
                                <div className="csv-upload-icon">📂</div>
                                <div className="csv-upload-label">
                                    {csvFileName
                                        ? <><strong>{csvFileName}</strong> — click to replace</>
                                        : <>Click to upload CSV file</>}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    style={{ display: "none" }}
                                    onChange={handleCSVUpload}
                                />
                            </div>

                            {isProcessing && <div className="csv-processing">⏳ Processing CSV…</div>}
                            {csvError && <div className="csv-error">{csvError}</div>}
                        </div>

                        {/* Original code input for CSV mode */}
                        <div className="csv-original-editor">
                            <CodeEditor title="Original Code" value={original} setValue={setOriginal} />
                        </div>

                        {/* Leaderboard result */}
                        {leaderboard.length > 0 && (
                            <div className="leaderboard-wrapper">
                                <h2 className="leaderboard-title">🏆 Leaderboard</h2>
                                <div className="leaderboard-table-container">
                                    <table className="leaderboard-table">
                                        <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>Name</th>
                                                <th>Accuracy</th>
                                                <th>Score Bar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((entry, index) => {
                                                const acc = parseFloat(entry.accuracy);
                                                const medals = ["🥇", "🥈", "🥉"];
                                                const isOpen = expandedRow === index;
                                                const errors = (entry.diff || []).filter(d => d.type === "wrong");
                                                return (
                                                    <React.Fragment key={index}>
                                                        <tr
                                                            className={`leaderboard-row ${index < 3 ? "top3" : ""} ${isOpen ? "row-expanded" : ""}`}
                                                            style={{ animationDelay: `${index * 60}ms` }}
                                                        >
                                                            <td className="rank-cell">
                                                                {index < 3
                                                                    ? <span className="medal">{medals[index]}</span>
                                                                    : <span className="rank-number">#{index + 1}</span>}
                                                            </td>
                                                            <td
                                                                className="name-cell name-clickable"
                                                                onClick={() => toggleRow(index)}
                                                                title="Click to view errors & code"
                                                            >
                                                                <span className="name-text">{entry.name}</span>
                                                                <span className={`expand-chevron ${isOpen ? "open" : ""}`}>▾</span>
                                                            </td>
                                                            <td className="accuracy-cell">
                                                                <span className={`accuracy-badge ${acc >= 80 ? "high" : acc >= 50 ? "mid" : "low"}`}>
                                                                    {entry.accuracy}%
                                                                </span>
                                                            </td>
                                                            <td className="bar-cell">
                                                                <div className="score-bar-bg">
                                                                    <div
                                                                        className={`score-bar-fill ${acc >= 80 ? "high" : acc >= 50 ? "mid" : "low"}`}
                                                                        style={{ width: `${Math.min(acc, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* ── Dropdown detail row ── */}
                                                        {isOpen && (
                                                            <tr className="detail-row">
                                                                <td colSpan={4} className="detail-cell">
                                                                    <div className="detail-panel">

                                                                        {/* Errors section */}
                                                                        <div className="detail-section">
                                                                            <h4 className="detail-heading">❌ Errors ({errors.length})</h4>
                                                                            {errors.length === 0 ? (
                                                                                <p className="detail-no-errors">🎉 No errors — perfect submission!</p>
                                                                            ) : (
                                                                                <div className="error-list">
                                                                                    {errors.map((err, ei) => (
                                                                                        <div key={ei} className="error-item">
                                                                                            <span className="error-submitted">{err.submitted || <em>missing</em>}</span>
                                                                                            <span className="error-arrow">→</span>
                                                                                            <span className="error-correct">{err.orig || <em>extra</em>}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Corrected / diff section */}
                                                                        <div className="detail-section">
                                                                            <h4 className="detail-heading">🔍 Submitted Code (diff view)</h4>
                                                                            <div className="detail-diff">
                                                                                {(entry.diff || []).map((token, ti) =>
                                                                                    token.type === "correct" ? (
                                                                                        <span key={ti} className="diff-token correct">{token.word}</span>
                                                                                    ) : (
                                                                                        <span key={ti} className="diff-token wrong" title={`Should be: ${token.orig}`}>{token.submitted || "∅"}</span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════ SINGLE COMPARE MODE ════════════ */}
                {!isLeaderboard && (
                    <div className="mode-panel" key="single">
                        <div className="editors">
                            <CodeEditor title="Original Code" value={original} setValue={setOriginal} />
                            <CodeEditor title="Participant Code" value={user} setValue={setUser} />
                        </div>
                        <CompareButton onClick={compareCode} />
                        <Result accuracy={accuracy} />
                        <DiffViewer diff={diff} />
                    </div>
                )}
            </div>
        </>
    );
}