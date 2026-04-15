import React from "react";

const medalEmoji = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ entries }) {
    if (!entries || entries.length === 0) return null;

    return (
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
                        {entries.map((entry, index) => {
                            const accuracy = parseFloat(entry.accuracy);
                            const isTop3 = index < 3;
                            return (
                                <tr
                                    key={index}
                                    className={`leaderboard-row rank-${index + 1} ${isTop3 ? "top3" : ""}`}
                                >
                                    <td className="rank-cell">
                                        {index < 3
                                            ? medalEmoji[index]
                                            : <span className="rank-number">#{index + 1}</span>}
                                    </td>
                                    <td className="name-cell">{entry.name}</td>
                                    <td className="accuracy-cell">
                                        <span className={`accuracy-badge ${accuracy >= 80 ? "high" : accuracy >= 50 ? "mid" : "low"}`}>
                                            {entry.accuracy}%
                                        </span>
                                    </td>
                                    <td className="bar-cell">
                                        <div className="score-bar-bg">
                                            <div
                                                className={`score-bar-fill ${accuracy >= 80 ? "high" : accuracy >= 50 ? "mid" : "low"}`}
                                                style={{ width: `${Math.min(accuracy, 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
