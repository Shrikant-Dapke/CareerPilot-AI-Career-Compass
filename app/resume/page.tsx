"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";

type Status = "idle" | "uploading" | "processing" | "done" | "error";

export default function ResumePage() {
  const { sessionId, userId } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setFile(accepted[0]); setStatus("idle"); setError(null); setResult(null); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const upload = async () => {
    console.log("[DIAG][FE] upload click", { file: file?.name, size: file?.size, type: file?.type, sessionId: sessionId?.slice(0, 8), userId: userId?.slice(0, 8) });
    if (!file || !sessionId || !userId) {
      console.warn("[DIAG][FE] missing file/session", { file: !!file, sessionId: !!sessionId, userId: !!userId });
      return;
    }
    setStatus("uploading");
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("session_id", sessionId);
      form.set("user_id", userId);
      console.log("[DIAG][FE] POST /api/resume FormData", { fileName: file.name, fileSize: file.size });
      setStatus("processing");
      const res = await fetch("/api/resume", { method: "POST", body: form });
      console.log("[DIAG][FE] /api/resume response", res.status, res.statusText);
      const data = await res.json();
      console.log("[DIAG][FE] /api/resume body", { ok: res.ok, hasResponse: !!data.response, error: data.error, code: (data as { code?: string }).code });
      if (!res.ok) throw new Error(data.details ? `${data.error} (${(data as { code?: string }).code ?? ""})` : data.error || "Upload failed");
      setResult(data.response);
      setStatus("done");
    } catch (e) {
      console.error("[DIAG][FE] upload error", e);
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Resume Analyzer</h1>
      <p className="mt-1 text-sm text-zinc-400">Upload PDF or DOCX. Your resume is sent to Career Compass Director for analysis.</p>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragActive ? "border-cyan-400 bg-cyan-500/10" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"}`}
          >
            <input {...getInputProps()} />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black"><Upload className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-medium">{isDragActive ? "Drop your resume here" : "Drop your resume here"}</div>
            <div className="text-xs text-zinc-400">PDF or DOCX, max 10 MB</div>
            <Button variant="ghost" size="sm" className="mt-4">Browse files</Button>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <FileText className="h-4 w-4 text-zinc-300" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm">{file.name}</div><div className="text-xs text-zinc-400">{formatFileSize(file.size)}</div></div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setStatus("idle"); setError(null); setResult(null); }}><X className="h-4 w-4" /></Button>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={upload} disabled={!file || status === "uploading" || status === "processing"}>
              {(status === "uploading" || status === "processing") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === "processing" ? "Analyzing..." : status === "uploading" ? "Uploading..." : "Analyze Resume"}
            </Button>
          </div>

          {status === "processing" && <div className="mt-3 text-xs text-zinc-400">Reading your resume… Understanding your experience…</div>}
          {error && <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"><AlertTriangle className="h-4 w-4" /> {error}</div>}
          {status === "done" && <div className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Analysis ready — see below and in AI Chat.</div>}
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader><div className="text-sm font-medium">Analysis result</div><div className="text-xs text-zinc-400">Rendered from Lyzr — no fields invented.</div></CardHeader>
          <CardContent><MarkdownRenderer content={result} /></CardContent>
        </Card>
      )}
    </div>
  );
}
