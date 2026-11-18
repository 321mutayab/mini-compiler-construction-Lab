import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  GitBranch,
  ShieldCheck,
  Cpu,
  Zap,
  Terminal,
} from 'lucide-react';
import { CompilationResult, formatNum } from '../compiler/compiler';
import { SyntaxTreeVisualizer } from './SyntaxTreeVisualizer';

export interface PhaseDefinition {
  number: number;
  title: string;
  subtitle: string;
  concept: string;
}

export const COMPILER_PHASES: PhaseDefinition[] = [
  {
    number: 1,
    title: 'Lexical Analysis',
    subtitle: 'Scanner & Tokenizer',
    concept:
      'The lexical analyzer scans the raw character stream from left to right, strips whitespace, and groups characters into meaningful atomic units called tokens (identifiers, numbers, and operators).',
  },
  {
    number: 2,
    title: 'Syntax Analysis',
    subtitle: 'Recursive-Descent Parser & AST',
    concept:
      'The parser checks whether the sequence of tokens obeys the grammar rules of the language and constructs an Abstract Syntax Tree (AST) that enforces operator precedence (* and / before + and -).',
  },
  {
    number: 3,
    title: 'Semantic Analysis',
    subtitle: 'Type & Logic Verification',
    concept:
      'The compiler checks whether the syntax tree makes logical sense according to language rules—verifying variable targets, operand types, and arithmetic safety such as division by zero.',
  },
  {
    number: 4,
    title: 'Intermediate Code Generation',
    subtitle: 'Three-Address Code (TAC)',
    concept:
      'The compiler translates the hierarchical syntax tree into a linear sequence of simple three-address instructions using temporary compiler variables (t1, t2, ...) with at most one operator per line.',
  },
  {
    number: 5,
    title: 'Code Optimization',
    subtitle: 'Constant Folding & Temp Elimination',
    concept:
      'The optimizer transforms the intermediate code into a faster, more compact equivalent without changing the final program output—evaluating known constants at compile time and removing redundant temporary variables.',
  },
  {
    number: 6,
    title: 'Target Code Generation',
    subtitle: 'Educational Pseudo-Assembly',
    concept:
      'The code generator translates intermediate operations into low-level assembly-like processor instructions (MOV, MUL, DIV, ADD, SUB, STORE) using CPU registers such as R1.',
  },
];

interface PhaseCardProps {
  phaseNumber: number;
  result: CompilationResult;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phaseNumber, result }) => {
  const phaseDef = COMPILER_PHASES[phaseNumber - 1];
  const errorAtThisPhase = result.error?.phase === phaseNumber;
  const blockedByEarlierError = result.error && result.error.phase < phaseNumber;

  const PhaseIcon =
    phaseNumber === 1
      ? Code2
      : phaseNumber === 2
      ? GitBranch
      : phaseNumber === 3
      ? ShieldCheck
      : phaseNumber === 4
      ? Terminal
      : phaseNumber === 5
      ? Zap
      : Cpu;

  return (
    <section
      aria-labelledby={`phase-heading-${phaseNumber}`}
      className={`rounded-2xl border transition-colors ${
        errorAtThisPhase
          ? 'border-rose-500/50 bg-[#0d1122]'
          : blockedByEarlierError
          ? 'border-slate-800/60 bg-[#090d1a]/75 opacity-75'
          : 'border-slate-800/90 bg-[#0b1020]'
      } p-6 sm:p-7`}
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <span className="font-mono font-semibold">Phase 0{phaseDef.number}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">{phaseDef.subtitle}</span>
          </div>
          <h3
            id={`phase-heading-${phaseNumber}`}
            className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            <PhaseIcon className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>
              Phase {phaseDef.number}: {phaseDef.title}
            </span>
          </h3>
        </div>

        {/* Status Indicator (Always pairs icon + text label for accessibility) */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {errorAtThisPhase ? (
            <span className="flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Failed in Phase {phaseNumber}</span>
            </span>
          ) : blockedByEarlierError ? (
            <span className="text-slate-500">Halted by Phase {result.error?.phase} Error</span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Completed</span>
            </span>
          )}
        </div>
      </div>

      {/* Educational Explanation */}
      <p className="mt-4 text-sm leading-relaxed text-slate-300">{phaseDef.concept}</p>

      {/* Blocked by earlier error state */}
      {blockedByEarlierError && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-[#060913] p-5 text-sm text-slate-400">
          This phase could not execute because compilation stopped at{' '}
          <strong className="text-slate-200">
            Phase {result.error?.phase} ({result.error?.phaseName})
          </strong>
          . Fix the expression above and click <strong>Run Compiler</strong> to inspect this phase.
        </div>
      )}

      {/* Error caught in THIS phase */}
      {errorAtThisPhase && result.error && (
        <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/20 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-400 shrink-0" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-rose-200">
                {result.error.phaseName} Error Detected
              </h4>
              <p className="text-sm text-rose-100/90">{result.error.message}</p>
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-indigo-300">How to fix: </span>
                {result.error.hint}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1 CONTENT: LEXICAL ANALYSIS */}
      {phaseNumber === 1 && !blockedByEarlierError && (
        <div className="mt-6 space-y-5">
          {/* Source Input & Token Stream ribbon */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>Input Expression Scanned</span>
              <span className="font-mono text-slate-300">{result.tokens.length} Tokens Extracted</span>
            </div>
            <div className="mt-2 font-mono text-base font-medium text-indigo-200">
              {result.input}
            </div>
            {result.tokens.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/70">
                {result.tokens.map((tok, i) => (
                  <React.Fragment key={tok.id}>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-center">
                      <div className="font-mono text-sm font-semibold text-white">{tok.lexeme}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{tok.tokenType}</div>
                    </div>
                    {i < result.tokens.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Token Table */}
          {result.tokens.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#060913]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/90 bg-slate-900/60 text-xs text-slate-400">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Lexeme (Symbol)</th>
                    <th className="px-4 py-3 font-medium">Token Type</th>
                    <th className="px-4 py-3 font-medium">Role in Expression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.tokens.map((tok) => (
                    <tr key={tok.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 tabular-nums">
                        {tok.id}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sm font-semibold text-indigo-300">
                        {tok.lexeme}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-200">{tok.tokenType}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{tok.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2 CONTENT: SYNTAX ANALYSIS */}
      {phaseNumber === 2 && !blockedByEarlierError && result.ast && (
        <div className="mt-6 space-y-5">
          <SyntaxTreeVisualizer ast={result.ast} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
              <h4 className="text-xs font-semibold text-indigo-300">
                Operator Precedence & Tree Structure
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                {result.precedenceNote}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
              <h4 className="text-xs font-semibold text-indigo-300">
                Bottom-Up Parse Evaluation Order
              </h4>
              <ol className="mt-2 space-y-1.5 text-xs text-slate-300">
                {result.syntaxExplanation.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono font-semibold text-indigo-400 tabular-nums">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3 CONTENT: SEMANTIC ANALYSIS */}
      {phaseNumber === 3 && !blockedByEarlierError && (
        <div className="mt-6 space-y-5">
          {/* Semantic Verification Banner */}
          <div
            className={`rounded-xl border p-4 ${
              result.semanticPassed
                ? 'border-emerald-500/30 bg-emerald-950/15'
                : 'border-rose-500/30 bg-rose-950/15'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              {result.semanticPassed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Semantic Verification Status: Passed</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Semantic Verification Status: Failed</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{result.semanticSummary}</p>
          </div>

          {/* Semantic Checks Checklist & Symbol Table */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
              <h4 className="text-xs font-semibold text-indigo-300">Semantic Rule Checks</h4>
              <ul className="mt-3 space-y-2.5 text-xs">
                {result.semanticChecks.map((chk, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 border-b border-slate-800/60 pb-2.5 last:border-none last:pb-0"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-slate-200">{chk.rule}</div>
                      <div className="mt-0.5 text-slate-400">{chk.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
              <h4 className="text-xs font-semibold text-indigo-300">Compiler Symbol Table</h4>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">Identifier</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Inferred Type</th>
                      <th className="pb-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.symbolTable.map((sym, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-mono font-semibold text-indigo-300">
                          {sym.name}
                        </td>
                        <td className="py-2.5 text-slate-300">{sym.kind}</td>
                        <td className="py-2.5 font-mono text-slate-300">{sym.dataType}</td>
                        <td className="py-2.5 font-mono font-semibold text-emerald-300 tabular-nums">
                          {sym.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4 CONTENT: INTERMEDIATE CODE GENERATION */}
      {phaseNumber === 4 && !blockedByEarlierError && result.success && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Three-Address Code (TAC) Instructions</span>
            <span>{result.tacSummary}</span>
          </div>

          <div className="space-y-2.5">
            {result.tacInstructions.map((instr) => (
              <div
                key={instr.step}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/90 bg-[#060913] px-4 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    0{instr.step}
                  </span>
                  <code className="font-mono text-base font-semibold text-indigo-200">
                    {instr.code}
                  </code>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{instr.explanation}</span>
                  {instr.computedValue !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-medium text-emerald-300 tabular-nums">
                        = {formatNum(instr.computedValue)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 5 CONTENT: CODE OPTIMIZATION */}
      {phaseNumber === 5 && !blockedByEarlierError && result.success && (
        <div className="mt-6 space-y-5">
          {/* Side-by-side comparison of Original TAC vs Optimized TAC */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  Before Optimization (Original TAC)
                </span>
                <span className="font-mono tabular-nums">
                  {result.tacInstructions.length} instruction
                  {result.tacInstructions.length > 1 ? 's' : ''}
                </span>
              </div>
              <pre className="mt-3 space-y-1.5 font-mono text-sm text-slate-300">
                {result.tacInstructions.map((t) => (
                  <div key={t.step} className="rounded bg-slate-900/70 px-3 py-1.5">
                    {t.code}
                  </div>
                ))}
              </pre>
            </div>

            <div className="rounded-xl border border-emerald-500/35 bg-[#060913] p-4">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span className="font-semibold">After Optimization (Optimized TAC)</span>
                <span className="font-mono tabular-nums">
                  {result.optimizedTacInstructions.length} instruction ·{' '}
                  {result.instructionsSaved} eliminated
                </span>
              </div>
              <pre className="mt-3 space-y-1.5 font-mono text-sm text-emerald-200">
                {result.optimizedTacInstructions.map((t) => (
                  <div
                    key={t.step}
                    className="rounded border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 font-semibold"
                  >
                    {t.code}
                  </div>
                ))}
              </pre>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {result.optimizationSummary}
              </p>
            </div>
          </div>

          {/* Step-by-step plain English explanation of each optimization pass */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913] p-4">
            <h4 className="text-xs font-semibold text-indigo-300">
              How the Optimizer Simplified Your Code
            </h4>
            <div className="mt-3 space-y-3">
              {result.optimizationSteps.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-2 border-b border-slate-800/60 pb-3 last:border-none last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200">
                      Pass {idx + 1}: {opt.title}
                    </div>
                    <p className="text-xs text-slate-400">{opt.description}</p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                    <span className="text-slate-400 line-through">{opt.before.split('\n')[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-semibold text-emerald-300">{opt.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 6 CONTENT: TARGET CODE GENERATION */}
      {phaseNumber === 6 && !blockedByEarlierError && result.success && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-500/25 bg-indigo-950/20 px-3.5 py-2 text-xs text-indigo-200">
            <span>
              <strong>Educational Note:</strong> These instructions represent educational
              pseudo-assembly designed for learning register allocation, not real executable hardware
              machine code.
            </span>
            <span className="font-mono text-indigo-300 tabular-nums">
              {result.assemblyInstructions.length} Instructions
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#060913]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/90 bg-slate-900/60 text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Line</th>
                  <th className="px-4 py-3 font-medium">Pseudo-Assembly Instruction</th>
                  <th className="px-4 py-3 font-medium">What This Instruction Does</th>
                  <th className="px-4 py-3 font-medium">Register / Memory State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.assemblyInstructions.map((ins) => (
                  <tr key={ins.line} className="hover:bg-slate-900/35 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">
                      0{ins.line}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-white">
                      <span className="text-indigo-400">{ins.opcode}</span>{' '}
                      <span className="text-slate-100">{ins.operands}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{ins.explanation}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-emerald-300 tabular-nums">
                      {ins.registerState}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
