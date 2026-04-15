export default function Result({ accuracy }) {
    return (
        <div className="result">
            <h2>Accuracy: {accuracy}%</h2>
        </div>
    );
}