"use client";

import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect } from "react";

loader.config({ monaco });

export function CodeEditor({ language, value, onChange }: { language: string; value: string; onChange: (value: string) => void }) {
  useEffect(() => {
    const workerUrl = new URL("monaco-editor/editor/editor.worker.js", import.meta.url);
    self.MonacoEnvironment = {
      getWorker: () => new Worker(workerUrl, { type: "module" }),
    };
  }, []);

  const handleMount: OnMount = (editor) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getDomNode()?.dispatchEvent(new CustomEvent("al2beat-save", { bubbles: true }));
    });
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(next) => onChange(next ?? "")}
      onMount={handleMount}
      beforeMount={(instance) => instance.editor.defineTheme("al2beat-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [{ token: "comment", foreground: "8292C9" }],
        colors: {
          "editor.background": "#080B20",
          "editor.lineHighlightBackground": "#111735",
          "editorCursor.foreground": "#A78BFA",
          "editor.selectionBackground": "#514AA266",
        },
      })}
      theme="al2beat-dark"
      loading={<div className="editor-loading">편집기 악보를 준비하는 중…</div>}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
        fontSize: 14,
        lineHeight: 22,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        renderLineHighlight: "gutter",
        wordWrap: "on",
        tabSize: 4,
        ariaLabel: "알고리즘 코드 편집기",
      }}
    />
  );
}
