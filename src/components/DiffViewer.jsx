export default function DiffViewer({ diff }) {
    return (
        <div className="diff-box">
            {diff.map((item, index) => (
                <span
                    key={index}
                    className={item.type === "correct" ? "correct" : "wrong"}
                >
                    {item.word}{" "}
                </span>
            ))}
        </div>
    );
}