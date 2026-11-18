import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Footprints,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { compileExpression, CompilationResult, formatNum } from './compiler/compiler';
import { COMPILER_PHASES, PhaseCard } from './components/PhaseCards';

interface ExampleProgram {
  label: string;
  expression: string;
  note: string;
}

const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    label: 'a = 5 + 3',
    expression: 'a = 5 + 3',
    note: 'Basic addition',
  },
  {
    label: 'a = 5 + 3 * 2',
    expression: 'a = 5 + 3 * 2',
    note: 'Operator precedence (* before +)',
  },
  {
    label: 'b = (10 - 4) / 2',
    expression: 'b = (10 - 4) / 2',
    note: 'Parentheses grouping',
  },
  {
    label: 'x = 8 * 2 + 5',
    expression: 'x = 8 * 2 + 5',
    note: 'Left-to-right precedence',
  },
];

const DIAGNOSTIC_EXAMPLES: ExampleProgram[] = [
  {
    label: 'a = 5 + $ 2',
    expression: 'a = 5 + $ 2',
    note: 'Phase 1 Lexical Error',
  },
  {
    label: 'a = 5 + * 2',
    expression: 'a = 5 + * 2',
    note: 'Phase 2 Syntax Error',
  },
  {
    label: 'a = 10 / 0',
    expression: 'a = 10 / 0',
    note: 'Phase 3 Semantic Error',
  },
];

export default function App() {
  const [expressionInput, setExpressionInput] = useState<string>('a = 5 + 3 * 2');
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(() =>
    compileExpression('a = 5 + 3 * 2')
  );
  const [viewMode, setViewMode] = useState<'all' | 'step'>('all');
  const [activePhase, setActivePhase] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleRunCompiler = (customInput?: string) => {
    const targetExpr = customInput !== undefined ? customInput : expressionInput;
    const res = compileExpression(targetExpr);
    setCompilationResult(res);
    if (res.error) {
      setActivePhase(res.error.phase);
    } else if (activePhase > 6 || activePhase < 1) {
      setActivePhase(1);
    }
  };

  const handleClear = () => {
    setExpressionInput('');
    setCompilationResult(null);
    setActivePhase(1);
  };

  const handleLoadExample = (expr: string) => {
    setExpressionInput(expr);
    const res = compileExpression(expr);
    setCompilationResult(res);
    if (res.error) {
      setActivePhase(res.error.phase);
    } else {
      setActivePhase(1);
    }
  };

  const handleCopyAssembly = () => {
    if (!compilationResult || !compilationResult.success) return;
    const text = compilationResult.assemblyInstructions
      .map((i) => i.fullInstruction)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle ambient background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/5 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Mini Compiler Lab
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a
              href="#editor"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Expression Input
            </a>
            <a
              href="#pipeline"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              6 Compiler Phases
            </a>
            <a
              href="#final-output"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Final Result
            </a>
            <a
              href="#grammar-guide"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Language Rules
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleRunCompiler()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Run Compiler
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        id="top"
        className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Hero & Expression Sandbox Section */}
        <section id="editor" className="space-y-6">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-medium text-indigo-400">
              Interactive Compiler Construction Practical Lab
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
              Mini Compiler Lab – Learn the 6 Compiler Phases
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Understand how a compiler transforms your program step by step.
            </p>
          </div>

          {/* Expression Input Workspace Card */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0b1020] p-6 sm:p-7 shadow-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCompiler();
              }}
              className="space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="expression-input"
                  className="text-sm font-semibold text-slate-200"
                >
                  Enter an Arithmetic Assignment Expression
                </label>
                <span className="text-xs text-slate-400">
                  Supports variables · numbers · = · + · - · * · / · parentheses ()
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Terminal className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
                  <input
                    id="expression-input"
                    type="text"
                    value={expressionInput}
                    onChange={(e) => setExpressionInput(e.target.value)}
                    placeholder="e.g., a = 5 + 3 * 2"
                    aria-label="Arithmetic expression input"
                    className="w-full rounded-xl border border-slate-700/90 bg-[#050811] py-3.5 pl-12 pr-4 font-mono text-base font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="submit"
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Run Compiler</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 px-4 py-3.5 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Example Programs Row */}
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 mr-1">
                    Load Example Program:
                  </span>
                  {EXAMPLE_PROGRAMS.map((ex) => {
                    const isCurrent = expressionInput.trim() === ex.expression;
                    return (
                      <button
                        key={ex.expression}
                        type="button"
                        onClick={() => handleLoadExample(ex.expression)}
                        title={ex.note}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isCurrent
                            ? 'border-indigo-500/60 bg-indigo-950/50 text-indigo-200'
                            : 'border-slate-800 bg-[#060913] text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {ex.label}
                      </button>
                    );
                  })}
                </div>

                {/* Test Error Diagnostics Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 mr-1">
                    Test Error Handling:
                  </span>
                  {DIAGNOSTIC_EXAMPLES.map((diag) => {
                    const isCurrent = expressionInput.trim() === diag.expression;
                    return (
                      <button
                        key={diag.expression}
                        type="button"
                        onClick={() => handleLoadExample(diag.expression)}
                        title={diag.note}
                        className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isCurrent
                            ? 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                            : 'border-slate-800/90 bg-[#060913] text-slate-400 hover:border-rose-500/40 hover:text-rose-200'
                        }`}
                      >
                        {diag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Empty State when Cleared */}
        {!compilationResult && (
          <section className="rounded-2xl border border-slate-800/80 bg-[#0b1020] p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <h2 className="font-display text-xl font-semibold text-white">
                Ready to Compile Your Expression
              </h2>
              <p className="text-sm text-slate-400">
                Type an arithmetic expression like <code className="text-indigo-300">a = 5 + 3 * 2</code> above or click any example program button, then press <strong>Run Compiler</strong> to inspect all six compiler phases.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLoadExample('a = 5 + 3 * 2')}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  Load Default Example (a = 5 + 3 * 2)
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Active Compilation Output */}
        {compilationResult && (
          <>
            {/* Global Error Banner if Compilation Failed */}
            {!compilationResult.success && compilationResult.error && (
              <section
                aria-live="polite"
                className="rounded-2xl border border-rose-500/50 bg-[#130b16] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <AlertTriangle className="mt-0.5 h-6 w-6 text-rose-400 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-rose-300">
                        <span>Compilation Stopped</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Phase {compilationResult.error.phase}:{' '}
                          {compilationResult.error.phaseName}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-semibold text-white">
                        {compilationResult.error.message}
                      </h2>
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-indigo-300">Suggestion: </span>
                        {compilationResult.error.hint}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadExample('a = 5 + 3 * 2')}
                    className="rounded-lg border border-rose-400/30 bg-rose-950/40 px-3.5 py-2 text-xs font-medium text-rose-100 hover:bg-rose-900/50 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start"
                  >
                    Reset to Valid Expression
                  </button>
                </div>
              </section>
            )}

            {/* Pipeline Navigation & Mode Controls */}
            <section id="pipeline" className="space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/90 bg-[#0b1020] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Compiler Pipeline Walkthrough
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choose between viewing all 6 compiler phases together or stepping through one phase at a time.
                  </p>
                </div>

                {/* Segmented View Mode Toggle */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-[#060913] p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      viewMode === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Show All 6 Phases</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('step')}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      viewMode === 'step'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Footprints className="h-3.5 w-3.5" />
                    <span>Step-by-Step Mode</span>
                  </button>
                </div>
              </div>

              {/* Interactive 6-Phase Pipeline Progress Bar */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {COMPILER_PHASES.map((phase) => {
                  const isCurrentStep = viewMode === 'step' && activePhase === phase.number;
                  const failedHere = compilationResult.error?.phase === phase.number;
                  const blocked =
                    compilationResult.error && compilationResult.error.phase < phase.number;

                  return (
                    <button
                      key={phase.number}
                      type="button"
                      onClick={() => {
                        setActivePhase(phase.number);
                        if (viewMode === 'all') {
                          const el = document.getElementById(`phase-heading-${phase.number}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        isCurrentStep
                          ? 'border-indigo-500 bg-indigo-950/35 ring-2 ring-indigo-500/30'
                          : failedHere
                          ? 'border-rose-500/50 bg-rose-950/20'
                          : blocked
                          ? 'border-slate-800/60 bg-[#080c17] opacity-60'
                          : 'border-slate-800/90 bg-[#0b1020] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-indigo-400">
                          0{phase.number}
                        </span>
                        {failedHere ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        ) : blocked ? (
                          <span className="text-[11px] text-slate-500">Blocked</span>
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-white group-hover:text-indigo-200 whitespace-nowrap truncate">
                        {phase.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                        {phase.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step-by-Step Navigation Bar when in 'step' mode */}
              {viewMode === 'step' && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-5 py-3.5">
                  <button
                    type="button"
                    disabled={activePhase <= 1}
                    onClick={() => setActivePhase((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous Phase</span>
                  </button>

                  <div className="text-center text-xs text-slate-300">
                    Viewing <strong className="text-white">Phase {activePhase} of 6</strong>:{' '}
                    <span className="text-indigo-300 font-medium">
                      {COMPILER_PHASES[activePhase - 1].title}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={activePhase >= 6}
                    onClick={() => setActivePhase((p) => Math.min(6, p + 1))}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Next Phase</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Render Phase Cards */}
              {viewMode === 'all' ? (
                <div className="space-y-6">
                  {COMPILER_PHASES.map((phase) => (
                    <PhaseCard
                      key={phase.number}
                      phaseNumber={phase.number}
                      result={compilationResult}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <PhaseCard phaseNumber={activePhase} result={compilationResult} />
                </div>
              )}
            </section>

            {/* Final Result Section */}
            <section
              id="final-output"
              aria-labelledby="final-result-heading"
              className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-[#0d1326] via-[#0b1020] to-[#110e24] p-6 sm:p-8 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-indigo-400">
                    End-to-End Compilation Summary
                  </p>
                  <h2
                    id="final-result-heading"
                    className="font-display text-2xl font-bold tracking-tight text-white"
                  >
                    Final Result
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  {compilationResult.success ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span>Compilation Status: Successful</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>
                        Compilation Status: Failed in Phase {compilationResult.error?.phase}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {compilationResult.success ? (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
                  {/* Left Column: Summary Metrics */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-5">
                      <div className="text-xs text-slate-400">Original Input</div>
                      <div className="mt-1.5 font-mono text-xl font-semibold text-white">
                        {compilationResult.input}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-5">
                      <div className="text-xs text-slate-400">Compilation Status</div>
                      <div className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>Successful</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        All 6 phases verified · {compilationResult.tokens.length} tokens ·{' '}
                        {compilationResult.tacInstructions.length} TAC steps
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/35 bg-[#060913] p-5">
                      <div className="text-xs text-slate-400">
                        Calculated Result ({compilationResult.targetVariable})
                      </div>
                      <div className="mt-1.5 font-mono text-3xl font-bold text-emerald-300 tabular-nums">
                        {formatNum(compilationResult.calculatedResult ?? 0)}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Assigned to variable{' '}
                        <code className="text-indigo-300">
                          {compilationResult.targetVariable} ={' '}
                          {formatNum(compilationResult.calculatedResult ?? 0)}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Final Target Code */}
                  <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#060913] p-5">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            Final Target Code (Educational Pseudo-Assembly)
                          </h3>
                          <p className="text-xs text-slate-400">
                            Generated register instructions for expression{' '}
                            <code className="text-indigo-300">{compilationResult.input}</code>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyAssembly}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-sm">
                        {compilationResult.assemblyInstructions.map((ins) => (
                          <div
                            key={ins.line}
                            className="flex items-center justify-between gap-4 rounded-lg bg-slate-900/75 px-3.5 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 tabular-nums">
                                0{ins.line}
                              </span>
                              <span className="font-semibold text-white">
                                <span className="text-indigo-400">{ins.opcode}</span>{' '}
                                {ins.operands}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-300/90 tabular-nums">
                              ; {ins.registerState}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                      Register <code className="text-indigo-300">R1</code> holds intermediate
                      arithmetic results before <code className="text-indigo-300">STORE</code> writes
                      the final value <strong className="text-emerald-300">{formatNum(compilationResult.calculatedResult ?? 0)}</strong> to{' '}
                      <code className="text-indigo-300">{compilationResult.targetVariable}</code>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-rose-500/30 bg-[#060913] p-5 text-sm text-slate-300">
                  Final target code and calculated result could not be produced because{' '}
                  <strong className="text-rose-300">
                    Phase {compilationResult.error?.phase} ({compilationResult.error?.phaseName})
                  </strong>{' '}
                  reported an error: <em>{compilationResult.error?.message}</em>
                </div>
              )}
            </section>
          </>
        )}

        {/* Quick Reference Guide for Students */}
        <section
          id="grammar-guide"
          className="rounded-2xl border border-slate-800/80 bg-[#0b1020] p-6 sm:p-7"
        >
          <div className="flex items-center gap-2.5 text-base font-semibold text-white">
            <BookOpen className="h-5 w-5 text-indigo-400 shrink-0" />
            <h2>Supported Arithmetic Language & Operator Precedence</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4 space-y-1.5">
              <div className="font-semibold text-indigo-300">1. Statement Syntax</div>
              <p className="text-slate-400 leading-relaxed">
                Every statement assigns an arithmetic expression to a variable identifier using{' '}
                <code className="text-slate-200">variable = expression</code> (for example,{' '}
                <code className="text-slate-200">a = 5 + 3 * 2</code>).
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4 space-y-1.5">
              <div className="font-semibold text-indigo-300">2. Operator Precedence</div>
              <p className="text-slate-400 leading-relaxed">
                Parentheses <code className="text-slate-200">()</code> are evaluated first, followed
                by Multiplication <code className="text-slate-200">*</code> and Division{' '}
                <code className="text-slate-200">/</code>, and finally Addition{' '}
                <code className="text-slate-200">+</code> and Subtraction{' '}
                <code className="text-slate-200">-</code>.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4 space-y-1.5">
              <div className="font-semibold text-indigo-300">3. Error Detection</div>
              <p className="text-slate-400 leading-relaxed">
                Invalid characters fail in Phase 1 (Lexical), grammar mistakes fail in Phase 2
                (Syntax), and undeclared variables or division by zero fail in Phase 3 (Semantic).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Educational Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060913] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          Mini Compiler Lab · Educational 6-Phase Compiler Construction Sandbox
        </div>
      </footer>
    </div>
  );
}
