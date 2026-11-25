// Toaster Error entry 2 — "The Funniest Toaster Error Message" (make.fun).
//
// The program reads the single-line entry from line.txt (shipped next to
// this file), validates it against the competition gate, and writes the exact
// bytes to $MAKEFUN_OUTPUT_DIR/entry.txt (or /output/entry.txt when the
// variable is unset). It does no network access and reads no environment
// variable besides MAKEFUN_OUTPUT_DIR.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Gate constants (from the competition rules, section "The gate").
// ---------------------------------------------------------------------------

/** Minimum length of the entry text, in Unicode code points. */
const MIN_CHARS = 1;

/** Maximum length of the entry text, in Unicode code points. */
const MAX_CHARS = 120;

/** Name of the file that holds the entry line, next to this script. */
const LINE_FILE_NAME = "line.txt";

/** Name of the file the grader reads. */
const OUTPUT_FILE_NAME = "entry.txt";

/** Output directory used when MAKEFUN_OUTPUT_DIR is not set. */
const DEFAULT_OUTPUT_DIR = "/output";

/** Name of the environment variable that redirects the output directory. */
const OUTPUT_DIR_ENV = "MAKEFUN_OUTPUT_DIR";

// ---------------------------------------------------------------------------
// Small single-purpose helpers.
// ---------------------------------------------------------------------------

/**
 * Count Unicode code points, not UTF-16 code units, so an emoji or an
 * accented letter counts once, the way the sealed gate counts it.
 */
function countCodePoints(text: string): number {
  let count = 0;
  for (const _ch of text) {
    count += 1;
  }
  return count;
}

/**
 * Strip a single trailing newline from the shipped file's contents: an
 * editor may have added "\n" or "\r\n" after the line, and that newline is
 * not part of the entry. Anything else is left untouched, so a stray blank
 * line inside the file still fails the gate instead of being hidden.
 */
function stripSingleTrailingNewline(raw: string): string {
  if (raw.endsWith("\r\n")) {
    return raw.slice(0, -2);
  }
  if (raw.endsWith("\n") || raw.endsWith("\r")) {
    return raw.slice(0, -1);
  }
  return raw;
}

/** True when the text holds nothing but white space (or is empty). */
function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Return the positions of every line break in the text. The gate wants a
 * single line, so any entry in this list is a failure.
 */
function findLineBreakPositions(text: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\n" || text[i] === "\r") {
      positions.push(i);
    }
  }
  return positions;
}

/**
 * Return the positions of control characters other than the line breaks
 * themselves. A stray tab or bell in an appliance message is a defect.
 */
function findControlCharPositions(text: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const isTab = code === 0x09;
    const isLineBreak = code === 0x0a || code === 0x0d;
    if (code < 0x20 && !isTab && !isLineBreak) {
      positions.push(i);
    }
    if (code === 0x7f) {
      positions.push(i);
    }
  }
  return positions;
}

/**
 * Score how much the line reads like a small appliance speaking to its
 * owner: one clear voice, present tense, no question aimed at the reader.
 * This is a diagnostic only; it never fails the gate.
 */
function scoreErrorVoice(text: string): number {
  let score = 0;
  const lower = text.toLowerCase();
  if (/\b(bagel|setting|toaster|toast|crumb|lever|slot)\b/.test(lower)) {
    score += 1; // names the appliance or one of its controls
  }
  if (/^(the|warning|error|notice|it|i|this)\b/i.test(text)) {
    score += 1; // opens as a statement, not a question or a shout
  }
  if (!text.includes("?")) {
    score += 1; // an error message states; it does not ask
  }
  if (!/[A-Z]{4,}/.test(text)) {
    score += 1; // no screaming block of capitals
  }
  return score;
}

/**
 * Check the closing remark: the line should end on a terminal mark (a
 * period here) so it reads as one finished sentence on a small display.
 * Diagnostic only; it never fails the gate.
 */
function checkClosingRemark(text: string): string | null {
  const trimmed = text.trimEnd();
  if (trimmed.length === 0) {
    return "empty line has no closing remark";
  }
  const last = trimmed[trimmed.length - 1];
  if (last === "." || last === "!" || last === "?") {
    return null;
  }
  return "line does not end with a terminal punctuation mark";
}

// ---------------------------------------------------------------------------
// Validation: returns the list of named gate failures (empty means valid).
// ---------------------------------------------------------------------------

type GateProblem = string;

function validateLine(text: string): GateProblem[] {
  const problems: GateProblem[] = [];

  if (isBlank(text)) {
    problems.push("blank: entry is empty or only white space");
  }

  const length = countCodePoints(text);
  if (length < MIN_CHARS) {
    problems.push(`too_short: ${length} chars, minimum is ${MIN_CHARS}`);
  }
  if (length > MAX_CHARS) {
    problems.push(`too_long: ${length} chars, maximum is ${MAX_CHARS}`);
  }

  const breaks = findLineBreakPositions(text);
  if (breaks.length > 0) {
    problems.push(
      `multi_line: ${breaks.length} line break(s) at position(s) ${breaks.join(", ")}`,
    );
  }

  const controls = findControlCharPositions(text);
  if (controls.length > 0) {
    problems.push(
      `control_chars: ${controls.length} control character(s) at position(s) ${controls.join(", ")}`,
    );
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Path resolution. Everything is anchored to this script file, never to the
// process working directory: the grader may run `node /bot/main.ts` from
// any directory, and a bare relative path would then point nowhere.
// ---------------------------------------------------------------------------

/** Directory that holds this script file. */
function scriptDirectory(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Absolute path of the shipped line.txt, next to this script. */
function lineFilePath(): string {
  return join(scriptDirectory(), LINE_FILE_NAME);
}

/** Output directory: the env override when set, else the default. */
function outputDirectory(): string {
  const override = process.env[OUTPUT_DIR_ENV];
  if (override !== undefined && override.trim().length > 0) {
    return resolve(override);
  }
  return DEFAULT_OUTPUT_DIR;
}

/** Absolute path of the entry file the grader reads. */
function outputFilePath(): string {
  return join(outputDirectory(), OUTPUT_FILE_NAME);
}

// ---------------------------------------------------------------------------
// Main flow.
// ---------------------------------------------------------------------------

function main(): number {
  const linePath = lineFilePath();
  let raw: string;
  try {
    raw = readFileSync(linePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`read_failed: cannot read ${linePath}: ${message}\n`);
    return 1;
  }

  // The shipped file holds the line with no trailing newline; strip one
  // trailing newline if an editor added it, and never touch anything else.
  const line = stripSingleTrailingNewline(raw);

  const problems = validateLine(line);
  if (problems.length > 0) {
    for (const problem of problems) {
      process.stderr.write(`gate_failed: ${problem}\n`);
    }
    return 1;
  }

  const outPath = outputFilePath();
  try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, line, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`write_failed: cannot write ${outPath}: ${message}\n`);
    return 1;
  }

  const voiceScore = scoreErrorVoice(line);
  const closingNote = checkClosingRemark(line);
  const chars = countCodePoints(line);
  const bytes = Buffer.byteLength(line, "utf8");
  console.log(`entry written: ${outPath}`);
  console.log(`length: ${chars} chars, ${bytes} bytes`);
  console.log(`error-voice score: ${voiceScore}/4`);
  if (closingNote !== null) {
    console.log(`closing note: ${closingNote}`);
  }
  console.log(`line: ${line}`);
  return 0;
}

process.exit(main());
