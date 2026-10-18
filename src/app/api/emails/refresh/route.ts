import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";

// email_agent/save_emails.py — runs the Gmail fetch pipeline and writes
// straight into public/emails.json. Only works when this Next.js server is
// running locally, since it needs the local venv, local token.json, and
// network access to Gmail (same constraint as the Live Detection backend).
function getPythonBin(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  const venvDir = [process.cwd(), ".venv"].join("/");
  return process.platform === "win32"
    ? [venvDir, "Scripts", "python.exe"].join("\\")
    : [venvDir, "bin", "python"].join("/");
}
const EMAIL_AGENT_DIR = path.join(process.cwd(), "email_agent");

const UNREACHABLE_MESSAGE =
  "Could not run the email pipeline. Make sure the project venv exists at .venv/ (see README) and that email_agent/credentials.json + token.json are set up.";

function runEmailPipeline(): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(getPythonBin(), ["save_emails.py"], { cwd: EMAIL_AGENT_DIR });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || stdout || `save_emails.py exited with code ${code}`));
      }
    });
  });
}

export async function POST() {
  try {
    const { stdout } = await runEmailPipeline();
    return NextResponse.json({ ok: true, output: stdout.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : UNREACHABLE_MESSAGE;
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
