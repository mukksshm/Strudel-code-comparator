import Editor from "@monaco-editor/react";

export default function CodeEditor({ title, value, setValue }) {
    return (
        <div className="editor-box">
            <h2>{title}</h2>
            <Editor
                height="500px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={value}
                onChange={(val) => setValue(val)}
            />
        </div>
    );
}