export type TokenCategory =
  | 'IDENTIFIER'
  | 'ASSIGN'
  | 'NUMBER'
  | 'OPERATOR'
  | 'PAREN';

export interface Token {
  id: number;
  lexeme: string;
  tokenType: string;
  category: TokenCategory;
  startPos: number;
  endPos: number;
  description: string;
}

export type ASTNodeType = 'Assignment' | 'BinaryExpression' | 'NumberLiteral' | 'Identifier' | 'UnaryExpression';

export interface ASTNode {
  id: string;
  type: ASTNodeType;
  label: string;
  operator?: string;
  value?: number | string;
  dataType?: 'integer' | 'float' | 'numeric';
  evaluatedValue?: number;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode;
}

export interface SemanticCheckItem {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface SymbolTableEntry {
  name: string;
  kind: 'Target Variable' | 'Referenced Variable';
  dataType: 'Integer' | 'Float';
  value: string;
  status: 'Initialized' | 'Undeclared';
}

export interface TACInstruction {
  step: number;
  code: string;
  result: string;
  arg1: string;
  operator?: string;
  arg2?: string;
  explanation: string;
  computedValue?: number;
}

export interface OptimizationStep {
  title: string;
  description: string;
  before: string;
  after: string;
}

export interface AssemblyInstruction {
  line: number;
  opcode: 'MOV' | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'STORE';
  operands: string;
  fullInstruction: string;
  explanation: string;
  registerState: string;
}

export interface CompilerError {
  phase: number;
  phaseName: string;
  message: string;
  hint: string;
  position?: number;
   offendingText?: string;
}

export interface CompilationResult {
  input: string;
  success: boolean;
  error?: CompilerError;
  targetVariable?: string;
  calculatedResult?: number;
  // Phase 1: Lexical Analysis
  tokens: Token[];
  lexicalSummary: string;
  // Phase 2: Syntax Analysis
  ast?: ASTNode;
  syntaxExplanation: string[];
  precedenceNote: string;
  // Phase 3: Semantic Analysis
  semanticPassed: boolean;
  semanticChecks: SemanticCheckItem[];
  symbolTable: SymbolTableEntry[];
  semanticSummary: string;
  // Phase 4: Intermediate Code Generation
  tacInstructions: TACInstruction[];
  tacSummary: string;
  // Phase 5: Code Optimization
  optimizedTacInstructions: TACInstruction[];
  optimizationSteps: OptimizationStep[];
  optimizationSummary: string;
  instructionsSaved: number;
  // Phase 6: Target Code Generation
  assemblyInstructions: AssemblyInstruction[];
  assemblySummary: string;
}

/**
 * Formats a number cleanly (avoids floating point noise like 3.3333333333333335)
 */
export function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(4)).toString();
}

/**
 * PHASE 1: LEXICAL ANALYZER (Tokenizer)
 */
function tokenize(input: string): { tokens: Token[]; error?: CompilerError } {
  const tokens: Token[] = [];
  let i = 0;
  let tokenId = 1;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Identifier: starts with letter or underscore
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        i++;
      }
      const lexeme = input.slice(start, i);
      tokens.push({
        id: tokenId++,
        lexeme,
        tokenType: 'Identifier',
        category: 'IDENTIFIER',
        startPos: start,
        endPos: i - 1,
        description: `Variable identifier '${lexeme}'`,
      });
      continue;
    }

    // Number literal (integer or decimal)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < input.length && /[0-9]/.test(input[i + 1]))) {
      const start = i;
      let dotCount = 0;
      while (i < input.length && (/[0-9]/.test(input[i]) || input[i] === '.')) {
        if (input[i] === '.') dotCount++;
        i++;
      }
      const lexeme = input.slice(start, i);

      // Check for invalid trailing letters right on a number like 5a
      if (i < input.length && /[a-zA-Z_]/.test(input[i])) {
        const badEnd = i + 1;
        const badLexeme = input.slice(start, badEnd);
        return {
          tokens,
          error: {
            phase: 1,
            phaseName: 'Lexical Analysis',
            message: `Invalid token "${badLexeme}" at position ${start + 1}. Identifiers cannot start with a digit.`,
            hint: `Insert an operator such as "${lexeme} * ${input[i]}" or rename the variable so it starts with a letter.`,
            position: start,
            offendingText: badLexeme,
          },
        };
      }

      if (dotCount > 1 || lexeme === '.') {
        return {
          tokens,
          error: {
            phase: 1,
            phaseName: 'Lexical Analysis',
            message: `Malformed numeric literal "${lexeme}" at position ${start + 1}.`,
            hint: 'A number can contain at most one decimal point (for example, 3.14).',
            position: start,
            offendingText: lexeme,
          },
        };
      }

      tokens.push({
        id: tokenId++,
        lexeme,
        tokenType: 'Number',
        category: 'NUMBER',
        startPos: start,
        endPos: i - 1,
        description: lexeme.includes('.')
          ? `Floating-point numeric constant (${lexeme})`
          : `Integer numeric constant (${lexeme})`,
      });
      continue;
    }

    // Operators and Parentheses
    if (ch === '=') {
      if (input[i + 1] === '=') {
        return {
          tokens,
          error: {
            phase: 1,
            phaseName: 'Lexical Analysis',
            message: `Unsupported equality operator "==" at position ${i + 1}.`,
            hint: 'Use a single "=" for variable assignment (for example: a = 5 + 3 * 2).',
            position: i,
            offendingText: '==',
          },
        };
      }
      tokens.push({
        id: tokenId++,
        lexeme: '=',
        tokenType: 'Assignment Operator',
        category: 'ASSIGN',
        startPos: i,
        endPos: i,
        description: 'Assigns the calculated right-hand value to the left-hand variable',
      });
      i++;
      continue;
    }

    if (ch === '+') {
      tokens.push({
        id: tokenId++,
        lexeme: '+',
        tokenType: 'Plus Operator',
        category: 'OPERATOR',
        startPos: i,
        endPos: i,
        description: 'Addition arithmetic operator',
      });
      i++;
      continue;
    }

    if (ch === '-') {
      tokens.push({
        id: tokenId++,
        lexeme: '-',
        tokenType: 'Minus Operator',
        category: 'OPERATOR',
        startPos: i,
        endPos: i,
        description: 'Subtraction arithmetic operator',
      });
      i++;
      continue;
    }

    if (ch === '*') {
      tokens.push({
        id: tokenId++,
        lexeme: '*',
        tokenType: 'Multiply Operator',
        category: 'OPERATOR',
        startPos: i,
        endPos: i,
        description: 'Multiplication arithmetic operator (higher precedence than + and -)',
      });
      i++;
      continue;
    }

    if (ch === '/') {
      tokens.push({
        id: tokenId++,
        lexeme: '/',
        tokenType: 'Divide Operator',
        category: 'OPERATOR',
        startPos: i,
        endPos: i,
        description: 'Division arithmetic operator (higher precedence than + and -)',
      });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({
        id: tokenId++,
        lexeme: '(',
        tokenType: 'Left Parenthesis',
        category: 'PAREN',
        startPos: i,
        endPos: i,
        description: 'Opens a grouped sub-expression to override default operator precedence',
      });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({
        id: tokenId++,
        lexeme: ')',
        tokenType: 'Right Parenthesis',
        category: 'PAREN',
        startPos: i,
        endPos: i,
        description: 'Closes a grouped sub-expression',
      });
      i++;
      continue;
    }

    // Semicolon (gracefully ignore if at the very end, or flag if mid-expression)
    if (ch === ';' && input.slice(i + 1).trim() === '') {
      i++;
      continue;
    }

    // Unrecognized character
    return {
      tokens,
      error: {
        phase: 1,
        phaseName: 'Lexical Analysis',
        message: `Unrecognized symbol "${ch}" at character position ${i + 1}.`,
        hint: 'Only variable names (a-z), numbers (0-9), parentheses (), assignment (=), and arithmetic operators (+, -, *, /) are allowed.',
        position: i,
        offendingText: ch,
      },
    };
  }

  return { tokens };
}

/**
 * PHASE 2: SYNTAX ANALYZER (Recursive Descent Parser)
 */
class Parser {
  private tokens: Token[];
  private pos = 0;
  private nodeCounter = 1;
  public hadParentheses = false;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private nextId(): string {
    return `node_${this.nodeCounter++}`;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  public parseStatement(): { ast?: ASTNode; error?: CompilerError } {
    if (this.tokens.length === 0) {
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: 'The input expression is empty.',
          hint: 'Enter an arithmetic assignment expression such as: a = 5 + 3 * 2',
        },
      };
    }

    // Check if there is an assignment operator '='
    const assignIndex = this.tokens.findIndex((t) => t.category === 'ASSIGN');

    if (assignIndex === -1) {
      // Allow pure arithmetic expressions by wrapping in an implicit 'result =' or explain assignment rule
      // Let's check: if the user typed `5 + 3 * 2` without `a =`, we can still parse it or require `variable = expression`.
      // Let's check if first token is an identifier or number. Requiring `variable = expression` or handling both?
      // Wait: the prompt states: "Support a small, clearly defined arithmetic language containing identifiers, numeric literals, assignment, addition, subtraction, multiplication, division, and parentheses."
      // Let's require `Identifier = Expression` so students see the full assignment AST (`=` root with target identifier on left and expression on right), OR if they omit `=`, give a clear, helpful syntax error telling them to assign to a variable like `a = ...`!
      const exprPreview = this.tokens.map((t) => t.lexeme).join(' ');
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: 'Missing assignment operator (=). Statements must assign an expression to a variable.',
          hint: `Try adding a target variable at the start, for example: a = ${exprPreview}`,
        },
      };
    }

    if (assignIndex === 0) {
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: 'Missing target variable before the "=" assignment operator.',
          hint: 'Place a variable name on the left side of "=", such as: a = 5 + 3 * 2',
          position: this.tokens[0].startPos,
          offendingText: '=',
        },
      };
    }

    if (assignIndex > 1) {
      const lhsTokens = this.tokens.slice(0, assignIndex).map((t) => t.lexeme).join(' ');
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: `Invalid left-hand side "${lhsTokens}" before "=". The left side of an assignment must be a single variable identifier.`,
          hint: 'Use a single variable name on the left side, such as: a = 5 + 3 * 2',
          position: this.tokens[0].startPos,
          offendingText: lhsTokens,
        },
      };
    }

    const lhsToken = this.consume(); // token at index 0
    const assignToken = this.consume(); // '=' at index 1

    // Check if there are any additional '=' operators in the rest of the tokens
    const extraAssign = this.tokens.slice(this.pos).find((t) => t.category === 'ASSIGN');
    if (extraAssign) {
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: `Unexpected second assignment operator "=" at position ${extraAssign.startPos + 1}.`,
          hint: 'Only one assignment operator "=" is allowed per statement.',
          position: extraAssign.startPos,
          offendingText: '=',
        },
      };
    }

    if (this.pos >= this.tokens.length) {
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: `Missing arithmetic expression after "${lhsToken.lexeme} =".`,
          hint: `Provide a value or calculation on the right side, such as: ${lhsToken.lexeme} = 5 + 3 * 2`,
          position: assignToken.endPos,
        },
      };
    }

    // Note: Even if lhsToken is a NUMBER (like `5 = 3 + 2`), we can either catch it in Syntax or Semantic Analysis.
    // Let's allow a single token on LHS in parser if it's a NumberLiteral so Semantic Analysis can demonstrate catching "Left-hand side of assignment must be a modifiable variable, not a constant number", OR if it's an Identifier create an Identifier node!
    const lhsNode: ASTNode =
      lhsToken.category === 'IDENTIFIER'
        ? {
            id: this.nextId(),
            type: 'Identifier',
            label: lhsToken.lexeme,
            value: lhsToken.lexeme,
          }
        : {
            id: this.nextId(),
            type: 'NumberLiteral',
            label: lhsToken.lexeme,
            value: Number(lhsToken.lexeme),
          };

    const rhsResult = this.parseExpression();
    if (rhsResult.error) {
      return { error: rhsResult.error };
    }

    if (this.pos < this.tokens.length) {
      const leftover = this.peek()!;
      if (leftover.lexeme === ')') {
        return {
          error: {
            phase: 2,
            phaseName: 'Syntax Analysis',
            message: `Unmatched closing parenthesis ")" at position ${leftover.startPos + 1}.`,
            hint: 'Every closing parenthesis ")" must have a matching opening parenthesis "(" earlier in the expression.',
            position: leftover.startPos,
            offendingText: ')',
          },
        };
      }
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: `Unexpected token "${leftover.lexeme}" (${leftover.tokenType}) at position ${leftover.startPos + 1}.`,
          hint: 'Two operands cannot appear side-by-side without an arithmetic operator (+, -, *, /) between them.',
          position: leftover.startPos,
          offendingText: leftover.lexeme,
        },
      };
    }

    const root: ASTNode = {
      id: this.nextId(),
      type: 'Assignment',
      label: '=',
      operator: '=',
      left: lhsNode,
      right: rhsResult.node!,
    };

    return { ast: root };
  }

  // Expression -> Term ( ('+' | '-') Term )*
  private parseExpression(): { node?: ASTNode; error?: CompilerError } {
    const leftRes = this.parseTerm();
    if (leftRes.error) return leftRes;
    let left = leftRes.node!;

    while (this.peek() && (this.peek()!.lexeme === '+' || this.peek()!.lexeme === '-')) {
      const opToken = this.consume();
      if (!this.peek()) {
        return {
          error: {
            phase: 2,
            phaseName: 'Syntax Analysis',
            message: `Incomplete expression: missing right-hand operand after "${opToken.lexeme}" operator.`,
            hint: `Add a number or variable after "${opToken.lexeme}".`,
            position: opToken.startPos,
            offendingText: opToken.lexeme,
          },
        };
      }
      const rightRes = this.parseTerm();
      if (rightRes.error) return rightRes;
      left = {
        id: this.nextId(),
        type: 'BinaryExpression',
        label: opToken.lexeme,
        operator: opToken.lexeme,
        left,
        right: rightRes.node!,
      };
    }

    return { node: left };
  }

  // Term -> Factor ( ('*' | '/') Factor )*
  private parseTerm(): { node?: ASTNode; error?: CompilerError } {
    const leftRes = this.parseFactor();
    if (leftRes.error) return leftRes;
    let left = leftRes.node!;

    while (this.peek() && (this.peek()!.lexeme === '*' || this.peek()!.lexeme === '/')) {
      const opToken = this.consume();
      if (!this.peek()) {
        return {
          error: {
            phase: 2,
            phaseName: 'Syntax Analysis',
            message: `Incomplete expression: missing right-hand operand after "${opToken.lexeme}" operator.`,
            hint: `Add a number or variable after "${opToken.lexeme}".`,
            position: opToken.startPos,
            offendingText: opToken.lexeme,
          },
        };
      }
      const rightRes = this.parseFactor();
      if (rightRes.error) return rightRes;
      left = {
        id: this.nextId(),
        type: 'BinaryExpression',
        label: opToken.lexeme,
        operator: opToken.lexeme,
        left,
        right: rightRes.node!,
      };
    }

    return { node: left };
  }

  // Factor -> Number | Identifier | '(' Expression ')' | ('-' Factor)
  private parseFactor(): { node?: ASTNode; error?: CompilerError } {
    const tok = this.peek();
    if (!tok) {
      return {
        error: {
          phase: 2,
          phaseName: 'Syntax Analysis',
          message: 'Unexpected end of expression while looking for a number or variable.',
          hint: 'Make sure every operator (+, -, *, /) has a valid operand on both sides.',
        },
      };
    }

    // Unary minus support (e.g. a = -5 + 3)
    if (tok.lexeme === '-') {
      this.consume();
      const operandRes = this.parseFactor();
      if (operandRes.error) return operandRes;
      // If operand is a direct NumberLiteral, fold unary minus into negative literal or UnaryExpression
      if (operandRes.node!.type === 'NumberLiteral') {
        const negVal = -Number(operandRes.node!.value);
        return {
          node: {
            id: this.nextId(),
            type: 'NumberLiteral',
            label: String(negVal),
            value: negVal,
          },
        };
      }
      return {
        node: {
          id: this.nextId(),
          type: 'UnaryExpression',
          label: 'neg',
          operator: '-',
          operand: operandRes.node!,
        },
      };
    }

    if (tok.lexeme === '(') {
      this.hadParentheses = true;
      const openParen = this.consume();
      if (this.peek()?.lexeme === ')') {
        const closeParen = this.peek()!;
        return {
          error: {
            phase: 2,
            phaseName: 'Syntax Analysis',
            message: `Empty parentheses "()" at position ${openParen.startPos + 1}.`,
            hint: 'Parentheses must contain a valid arithmetic expression, such as (10 - 4).',
            position: closeParen.startPos,
            offendingText: '()',
          },
        };
      }
      const exprRes = this.parseExpression();
      if (exprRes.error) return exprRes;

      const closeTok = this.peek();
      if (!closeTok || closeTok.lexeme !== ')') {
        return {
          error: {
            phase: 2,
            phaseName: 'Syntax Analysis',
            message: `Missing closing parenthesis ")" for "(" opened at position ${openParen.startPos + 1}.`,
            hint: 'Add a matching ")" to close the grouped sub-expression.',
            position: openParen.startPos,
            offendingText: '(',
          },
        };
      }
      this.consume(); // consume ')'
      return { node: exprRes.node };
    }

    if (tok.category === 'NUMBER') {
      this.consume();
      return {
        node: {
          id: this.nextId(),
          type: 'NumberLiteral',
          label: tok.lexeme,
          value: Number(tok.lexeme),
        },
      };
    }

    if (tok.category === 'IDENTIFIER') {
      this.consume();
      return {
        node: {
          id: this.nextId(),
          type: 'Identifier',
          label: tok.lexeme,
          value: tok.lexeme,
        },
      };
    }

    return {
      error: {
        phase: 2,
        phaseName: 'Syntax Analysis',
        message: `Syntax error: unexpected "${tok.lexeme}" (${tok.tokenType}) at position ${tok.startPos + 1}. Expected a number, variable, or "(".`,
        hint: `Consecutive operators like "+ ${tok.lexeme}" are not valid grammar. Remove the extra operator or place a number between them.`,
        position: tok.startPos,
        offendingText: tok.lexeme,
      },
    };
  }
}

/**
 * Helper to format AST subtrees back into human-readable mathematical text
 */
function astToString(node: ASTNode): string {
  if (node.type === 'NumberLiteral' || node.type === 'Identifier') {
    return String(node.label);
  }
  if (node.type === 'UnaryExpression' && node.operand) {
    return `(-${astToString(node.operand)})`;
  }
  if (node.type === 'BinaryExpression' && node.left && node.right) {
    return `${astToString(node.left)} ${node.operator} ${astToString(node.right)}`;
  }
  if (node.type === 'Assignment' && node.left && node.right) {
    return `${astToString(node.left)} = ${astToString(node.right)}`;
  }
  return node.label;
}

/**
 * Builds step-by-step evaluation order explanation from the AST for Phase 2
 */
function buildSyntaxExplanation(ast: ASTNode, hadParentheses: boolean): { steps: string[]; precedenceNote: string } {
  const steps: string[] = [];
  let hasHigherPrecedenceChild = false;
  let precedenceNote =
    'The parser constructed a hierarchical Abstract Syntax Tree (AST) where deeper child nodes are evaluated first.';

  function walkPostOrder(node: ASTNode) {
    if (node.type === 'BinaryExpression' && node.left && node.right) {
      // If left is a leaf and right is a BinaryExpression (like 5 + 3 * 2), visit right first so explanation matches evaluation order!
      if (node.left.type !== 'BinaryExpression' && node.right.type === 'BinaryExpression') {
        walkPostOrder(node.right);
        walkPostOrder(node.left);
      } else {
        walkPostOrder(node.left);
        walkPostOrder(node.right);
      }

      const opName =
        node.operator === '*'
          ? 'Multiplication'
          : node.operator === '/'
          ? 'Division'
          : node.operator === '+'
          ? 'Addition'
          : 'Subtraction';

      if (
        (node.operator === '+' || node.operator === '-') &&
        (node.left.operator === '*' ||
          node.left.operator === '/' ||
          node.right.operator === '*' ||
          node.right.operator === '/')
      ) {
        hasHigherPrecedenceChild = true;
      }

      steps.push(
        `Evaluate ${opName.toLowerCase()} sub-tree: (${astToString(node.left)} ${node.operator} ${astToString(node.right)})`
      );
    }
  }

  if (ast.right) {
    walkPostOrder(ast.right);
  }
  if (ast.left) {
    steps.push(`Assign the final expression result to target variable "${ast.left.label}".`);
  }

  if (hadParentheses) {
    precedenceNote =
      'Parentheses () were detected in the expression. The parser placed the parenthesized sub-expression deeper in the tree so it is evaluated first before outer operators.';
  } else if (hasHigherPrecedenceChild) {
    precedenceNote =
      'Operator Precedence Applied: Multiplication (*) and Division (/) bind more tightly than Addition (+) and Subtraction (-), so they are placed lower in the syntax tree and evaluated first.';
  } else {
    precedenceNote =
      'Operators of equal precedence are parsed left-to-right and structured into a balanced binary syntax tree.';
  }

  return { steps, precedenceNote };
}

/**
 * PHASE 3: SEMANTIC ANALYZER
 */
function analyzeSemantics(ast: ASTNode): {
  passed: boolean;
  checks: SemanticCheckItem[];
  symbolTable: SymbolTableEntry[];
  summary: string;
  evaluatedValue?: number;
  error?: CompilerError;
} {
  const checks: SemanticCheckItem[] = [];
  const symbolTable: SymbolTableEntry[] = [];

  // 1. Check Left-Hand Side is a valid Identifier
  const lhs = ast.left!;
  if (lhs.type !== 'Identifier') {
    checks.push({
      rule: 'L-Value Assignment Target Check',
      passed: false,
      detail: `Left-hand side "${lhs.label}" is a constant numeric literal, not a modifiable variable identifier.`,
    });
    return {
      passed: false,
      checks,
      symbolTable,
      summary: `Semantic Error: Cannot assign a value to constant number "${lhs.label}".`,
      error: {
        phase: 3,
        phaseName: 'Semantic Analysis',
        message: `Invalid assignment target "${lhs.label}". You cannot assign a value to a constant number.`,
        hint: 'Place a variable identifier (such as a, b, or x) on the left side of "=".',
      },
    };
  }

  checks.push({
    rule: 'Valid Assignment Target (L-Value)',
    passed: true,
    detail: `Left-hand side "${lhs.label}" is a valid modifiable variable identifier.`,
  });

  // 2. Check for undeclared identifiers on the Right-Hand Side & evaluate numeric types
  const undeclaredVars: string[] = [];
  let hasFloat = false;
  let divByZeroSubexpr: string | null = null;

  function evaluateNode(node: ASTNode): number {
    if (node.type === 'NumberLiteral') {
      const val = Number(node.value);
      const isFlt = !Number.isInteger(val);
      if (isFlt) hasFloat = true;
      node.dataType = isFlt ? 'float' : 'integer';
      node.evaluatedValue = val;
      return val;
    }

    if (node.type === 'Identifier') {
      const varName = String(node.value);
      if (!undeclaredVars.includes(varName)) {
        undeclaredVars.push(varName);
      }
      node.dataType = 'numeric';
      node.evaluatedValue = NaN;
      return NaN;
    }

    if (node.type === 'UnaryExpression' && node.operand) {
      const val = -evaluateNode(node.operand);
      node.dataType = node.operand.dataType;
      node.evaluatedValue = val;
      return val;
    }

    if (node.type === 'BinaryExpression' && node.left && node.right) {
      const leftVal = evaluateNode(node.left);
      const rightVal = evaluateNode(node.right);

      let result = NaN;
      if (!Number.isNaN(leftVal) && !Number.isNaN(rightVal)) {
        if (node.operator === '+') result = leftVal + rightVal;
        else if (node.operator === '-') result = leftVal - rightVal;
        else if (node.operator === '*') result = leftVal * rightVal;
        else if (node.operator === '/') {
          if (rightVal === 0) {
            divByZeroSubexpr = `${astToString(node.left)} / ${astToString(node.right)}`;
            result = NaN;
          } else {
            result = leftVal / rightVal;
          }
        }
      }

      if (!Number.isNaN(result) && !Number.isInteger(result)) {
        hasFloat = true;
      }

      node.dataType = hasFloat ? 'float' : 'integer';
      node.evaluatedValue = result;
      return result;
    }

    return NaN;
  }

  const finalVal = evaluateNode(ast.right!);
  ast.evaluatedValue = finalVal;
  ast.dataType = hasFloat ? 'float' : 'integer';
  lhs.dataType = hasFloat ? 'float' : 'integer';
  lhs.evaluatedValue = finalVal;

  if (undeclaredVars.length > 0) {
    for (const v of undeclaredVars) {
      symbolTable.push({
        name: v,
        kind: 'Referenced Variable',
        dataType: 'Integer',
        value: 'Undefined',
        status: 'Undeclared',
      });
    }
    const listStr = undeclaredVars.map((v) => `"${v}"`).join(', ');
    checks.push({
      rule: 'Variable Declaration & Scope Check',
      passed: false,
      detail: `Variable ${listStr} is used in the expression before being assigned a numeric value.`,
    });
    return {
      passed: false,
      checks,
      symbolTable,
      summary: `Semantic Error: Undeclared variable ${listStr} referenced on the right-hand side.`,
      error: {
        phase: 3,
        phaseName: 'Semantic Analysis',
        message: `Semantic Error: Variable ${listStr} has not been initialized with a value.`,
        hint: `Replace ${listStr} with a number (such as 5 or 10) so the compiler can evaluate the arithmetic expression.`,
      },
    };
  }

  checks.push({
    rule: 'Identifier & Constant Resolution',
    passed: true,
    detail: 'All operands in the right-hand expression are valid numeric constants.',
  });

  checks.push({
    rule: 'Operator & Type Compatibility Check',
    passed: true,
    detail: `All arithmetic operators receive compatible numeric operands (${hasFloat ? 'Float / NumericPromotion' : 'Integer'}).`,
  });

  if (divByZeroSubexpr) {
    checks.push({
      rule: 'Arithmetic Safety (Division by Zero)',
      passed: false,
      detail: `Division by zero detected in sub-expression "${divByZeroSubexpr}".`,
    });
    return {
      passed: false,
      checks,
      symbolTable,
      summary: `Semantic Error: Division by zero in "${divByZeroSubexpr}" is undefined in arithmetic.`,
      error: {
        phase: 3,
        phaseName: 'Semantic Analysis',
        message: `Division by zero detected in "${divByZeroSubexpr}".`,
        hint: 'Change the divisor to a non-zero number.',
      },
    };
  }

  checks.push({
    rule: 'Arithmetic Safety Check',
    passed: true,
    detail: 'No division by zero or invalid arithmetic operations found.',
  });

  symbolTable.push({
    name: lhs.label,
    kind: 'Target Variable',
    dataType: hasFloat ? 'Float' : 'Integer',
    value: formatNum(finalVal),
    status: 'Initialized',
  });

  return {
    passed: true,
    checks,
    symbolTable,
    summary: `Semantic analysis passed. Variable "${lhs.label}" is assigned a valid ${
      hasFloat ? 'floating-point' : 'integer'
    } result (${formatNum(finalVal)}) with full type compatibility.`,
    evaluatedValue: finalVal,
  };
}

/**
 * PHASE 4: INTERMEDIATE CODE GENERATION (Three-Address Code - TAC)
 */
function generateTAC(ast: ASTNode): TACInstruction[] {
  const instructions: TACInstruction[] = [];
  let tempCounter = 1;
  let stepCounter = 1;

  function genExpr(node: ASTNode): { place: string; val: number } {
    if (node.type === 'NumberLiteral' || node.type === 'Identifier') {
      return { place: String(node.label), val: Number(node.evaluatedValue) };
    }

    if (node.type === 'UnaryExpression' && node.operand) {
      const opRes = genExpr(node.operand);
      const temp = `t${tempCounter++}`;
      const computed = -opRes.val;
      instructions.push({
        step: stepCounter++,
        code: `${temp} = -${opRes.place}`,
        result: temp,
        operator: 'UMINUS',
        arg1: opRes.place,
        explanation: `Negate ${opRes.place} and store in temporary variable ${temp} (${formatNum(computed)})`,
        computedValue: computed,
      });
      return { place: temp, val: computed };
    }

    if (node.type === 'BinaryExpression' && node.left && node.right) {
      // Important: If left is a simple literal and right is a compound BinaryExpression (e.g., 5 + 3 * 2),
      // evaluate the compound right child first so t1 = 3 * 2 is emitted first, followed by t2 = 5 + t1!
      let leftPlace: { place: string; val: number };
      let rightPlace: { place: string; val: number };

      if (node.left.type !== 'BinaryExpression' && node.right.type === 'BinaryExpression') {
        rightPlace = genExpr(node.right);
        leftPlace = genExpr(node.left);
      } else {
        leftPlace = genExpr(node.left);
        rightPlace = genExpr(node.right);
      }

      const temp = `t${tempCounter++}`;
      const computed = Number(node.evaluatedValue);
      const opSymbol = node.operator!;
      const opWord =
        opSymbol === '*'
          ? 'Multiply'
          : opSymbol === '/'
          ? 'Divide'
          : opSymbol === '+'
          ? 'Add'
          : 'Subtract';

      instructions.push({
        step: stepCounter++,
        code: `${temp} = ${leftPlace.place} ${opSymbol} ${rightPlace.place}`,
        result: temp,
        arg1: leftPlace.place,
        operator: opSymbol,
        arg2: rightPlace.place,
        explanation: `${opWord} ${leftPlace.place} and ${rightPlace.place}, storing intermediate result ${formatNum(
          computed
        )} in ${temp}`,
        computedValue: computed,
      });

      return { place: temp, val: computed };
    }

    return { place: '0', val: 0 };
  }

  const targetVar = ast.left!.label;
  const rhs = ast.right!;

  if (rhs.type === 'NumberLiteral') {
    const val = Number(rhs.evaluatedValue);
    instructions.push({
      step: stepCounter++,
      code: `${targetVar} = ${rhs.label}`,
      result: targetVar,
      arg1: rhs.label,
      explanation: `Directly assign constant ${rhs.label} to variable ${targetVar}`,
      computedValue: val,
    });
  } else {
    const rhsPlace = genExpr(rhs);
    instructions.push({
      step: stepCounter++,
      code: `${targetVar} = ${rhsPlace.place}`,
      result: targetVar,
      arg1: rhsPlace.place,
      explanation: `Copy final temporary result from ${rhsPlace.place} (${formatNum(
        rhsPlace.val
      )}) into target variable ${targetVar}`,
      computedValue: rhsPlace.val,
    });
  }

  return instructions;
}

/**
 * PHASE 5: CODE OPTIMIZATION
 */
function optimizeTAC(
  originalTac: TACInstruction[],
  targetVar: string,
  finalValue: number
): {
  optimizedTac: TACInstruction[];
  steps: OptimizationStep[];
  summary: string;
  instructionsSaved: number;
} {
  const steps: OptimizationStep[] = [];
  const optimizedTac: TACInstruction[] = [];

  if (originalTac.length <= 1) {
    optimizedTac.push(...originalTac);
    return {
      optimizedTac,
      steps: [
        {
          title: 'Already Minimal Instruction',
          description:
            'The intermediate code contains a single direct assignment with no temporary variables or arithmetic operations to fold.',
          before: originalTac[0]?.code || '',
          after: originalTac[0]?.code || '',
        },
      ],
      summary: 'The expression is already in its simplest single-instruction form.',
      instructionsSaved: 0,
    };
  }

  // Build progressive optimization steps to show students both Constant Folding & Dead Temp Elimination
  const tempValues = new Map<string, string>();
  const intermediateLines: string[] = [];

  for (let i = 0; i < originalTac.length - 1; i++) {
    const instr = originalTac[i];
    const resolvedArg1 = tempValues.get(instr.arg1) ?? instr.arg1;
    const resolvedArg2 = instr.arg2 ? (tempValues.get(instr.arg2) ?? instr.arg2) : undefined;
    const foldedVal = formatNum(instr.computedValue ?? 0);

    steps.push({
      title: `Constant Folding on ${instr.result}`,
      description: `Pre-calculate constant expression (${resolvedArg1} ${instr.operator} ${resolvedArg2}) at compile time to get ${foldedVal}.`,
      before: instr.code,
      after: `${instr.result} = ${foldedVal}`,
    });

    tempValues.set(instr.result, foldedVal);
    intermediateLines.push(`${instr.result} = ${foldedVal}`);
  }

  const lastInstr = originalTac[originalTac.length - 1];
  const finalFormatted = formatNum(finalValue);

  // Copy Propagation & Temporary Variable Elimination step
  steps.push({
    title: 'Temporary Variable Elimination (Copy Propagation)',
    description: `Remove temporary variable${
      originalTac.length > 2 ? 's' : ''
    } (${originalTac
      .slice(0, -1)
      .map((t) => t.result)
      .join(', ')}) and assign the folded constant result directly to "${targetVar}".`,
    before: [...intermediateLines, lastInstr.code].join('\n'),
    after: `${targetVar} = ${finalFormatted}`,
  });

  // Also provide the compact optimized TAC representation:
  // If original had multiple arithmetic ops (e.g., t1 = 3 * 2, t2 = 5 + t1, a = t2),
  // we show the folded intermediate step and final direct assignment so students see the simplified code clearly.
  if (originalTac.length >= 3) {
    const firstOp = originalTac[0];
    const secondToLast = originalTac[originalTac.length - 2];
    const foldedFirst = formatNum(firstOp.computedValue ?? 0);
    const lhsfolded = secondToLast.arg1 === firstOp.result ? foldedFirst : secondToLast.arg1;
    const rhsfolded = secondToLast.arg2 === firstOp.result ? foldedFirst : secondToLast.arg2;

    optimizedTac.push({
      step: 1,
      code: `${targetVar} = ${lhsfolded} ${secondToLast.operator} ${rhsfolded}  →  ${targetVar} = ${finalFormatted}`,
      result: targetVar,
      arg1: finalFormatted,
      explanation: `Constant folding evaluates sub-expressions at compile time and eliminates temporary variables (${originalTac
        .slice(0, -1)
        .map((t) => t.result)
        .join(', ')}), assigning ${finalFormatted} directly to ${targetVar}.`,
      computedValue: finalValue,
    });
  } else {
    optimizedTac.push({
      step: 1,
      code: `${targetVar} = ${finalFormatted}`,
      result: targetVar,
      arg1: finalFormatted,
      explanation: `Constant folding evaluates ${originalTac[0].arg1} ${originalTac[0].operator} ${originalTac[0].arg2} = ${finalFormatted} and eliminates temporary ${originalTac[0].result}.`,
      computedValue: finalValue,
    });
  }

  const saved = originalTac.length - optimizedTac.length;

  return {
    optimizedTac,
    steps,
    summary: `Reduced ${originalTac.length} three-address instructions down to ${optimizedTac.length} direct assignment by applying Constant Folding and eliminating ${
      originalTac.length - 1
    } temporary variable${originalTac.length - 1 > 1 ? 's' : ''}.`,
    instructionsSaved: saved,
  };
}

/**
 * PHASE 6: TARGET CODE GENERATION (Educational Pseudo-Assembly)
 * Generates clean register-based instructions (MOV, MUL, DIV, ADD, SUB, STORE)
 * matching university compiler construction textbook conventions.
 */
function generateAssembly(ast: ASTNode): AssemblyInstruction[] {
  const instructions: AssemblyInstruction[] = [];
  let lineNum = 1;

  function opToMnemonic(op: string): 'ADD' | 'SUB' | 'MUL' | 'DIV' {
    switch (op) {
      case '+':
        return 'ADD';
      case '-':
        return 'SUB';
      case '*':
        return 'MUL';
      case '/':
        return 'DIV';
      default:
        return 'ADD';
    }
  }

  function opToVerb(op: string): { verb: string; prep: string } {
    switch (op) {
      case '+':
        return { verb: 'Add', prep: 'to' };
      case '-':
        return { verb: 'Subtract', prep: 'from' };
      case '*':
        return { verb: 'Multiply', prep: 'by' };
      case '/':
        return { verb: 'Divide', prep: 'by' };
      default:
        return { verb: 'Add', prep: 'to' };
    }
  }

  /**
   * Evaluates an AST subtree into register `R{regIdx}` and returns the computed value
   */
  function emitSubtree(node: ASTNode, regIdx: number): number {
    const regName = `R${regIdx}`;

    if (node.type === 'NumberLiteral') {
      const val = Number(node.evaluatedValue);
      instructions.push({
        line: lineNum++,
        opcode: 'MOV',
        operands: `${regName}, ${node.label}`,
        fullInstruction: `MOV ${regName}, ${node.label}`,
        explanation: `Load constant value ${node.label} into register ${regName}`,
        registerState: `${regName} = ${formatNum(val)}`,
      });
      return val;
    }

    if (node.type === 'UnaryExpression' && node.operand) {
      const val = Number(node.evaluatedValue);
      instructions.push({
        line: lineNum++,
        opcode: 'MOV',
        operands: `${regName}, ${formatNum(val)}`,
        fullInstruction: `MOV ${regName}, ${formatNum(val)}`,
        explanation: `Load negated value ${formatNum(val)} into register ${regName}`,
        registerState: `${regName} = ${formatNum(val)}`,
      });
      return val;
    }

    if (node.type === 'BinaryExpression' && node.left && node.right) {
      const op = node.operator!;
      const mnemonic = opToMnemonic(op);
      const { verb, prep } = opToVerb(op);
      const resultVal = Number(node.evaluatedValue);

      const leftIsLeaf = node.left.type === 'NumberLiteral';
      const rightIsLeaf = node.right.type === 'NumberLiteral';

      // Case 1: Both children are simple number literals (e.g., 3 * 2)
      if (leftIsLeaf && rightIsLeaf) {
        const leftVal = Number(node.left.evaluatedValue);
        instructions.push({
          line: lineNum++,
          opcode: 'MOV',
          operands: `${regName}, ${node.left.label}`,
          fullInstruction: `MOV ${regName}, ${node.left.label}`,
          explanation: `Load constant ${node.left.label} into register ${regName}`,
          registerState: `${regName} = ${formatNum(leftVal)}`,
        });

        instructions.push({
          line: lineNum++,
          opcode: mnemonic,
          operands: `${regName}, ${node.right.label}`,
          fullInstruction: `${mnemonic} ${regName}, ${node.right.label}`,
          explanation: `${verb} register ${regName} ${prep} ${node.right.label}`,
          registerState: `${regName} = ${formatNum(resultVal)}`,
        });
        return resultVal;
      }

      // Case 2: Left is compound and Right is simple literal (e.g., (10 - 4) / 2 or 8 * 2 + 5)
      if (!leftIsLeaf && rightIsLeaf) {
        emitSubtree(node.left, regIdx);
        instructions.push({
          line: lineNum++,
          opcode: mnemonic,
          operands: `${regName}, ${node.right.label}`,
          fullInstruction: `${mnemonic} ${regName}, ${node.right.label}`,
          explanation: `${verb} register ${regName} ${prep} ${node.right.label}`,
          registerState: `${regName} = ${formatNum(resultVal)}`,
        });
        return resultVal;
      }

      // Case 3: Left is simple literal and Right is compound (e.g., 5 + 3 * 2)
      if (leftIsLeaf && !rightIsLeaf) {
        // For commutative operators (+ and *), evaluate right child into regIdx first, then apply left literal!
        // This produces the exact textbook sequence:
        // MOV R1, 3 -> MUL R1, 2 -> ADD R1, 5 -> STORE a, R1
        if (op === '+' || op === '*') {
          emitSubtree(node.right, regIdx);
          instructions.push({
            line: lineNum++,
            opcode: mnemonic,
            operands: `${regName}, ${node.left.label}`,
            fullInstruction: `${mnemonic} ${regName}, ${node.left.label}`,
            explanation: `${verb} ${node.left.label} ${prep} register ${regName}`,
            registerState: `${regName} = ${formatNum(resultVal)}`,
          });
          return resultVal;
        } else {
          // Non-commutative (- or /): e.g., 10 - 3 * 2
          // Evaluate right child into R{regIdx + 1}, load left into R{regIdx}, then SUB/DIV R{regIdx}, R{regIdx + 1}
          const rightRegIdx = regIdx + 1;
          const rightRegName = `R${rightRegIdx}`;
          emitSubtree(node.right, rightRegIdx);
          const leftVal = Number(node.left.evaluatedValue);
          instructions.push({
            line: lineNum++,
            opcode: 'MOV',
            operands: `${regName}, ${node.left.label}`,
            fullInstruction: `MOV ${regName}, ${node.left.label}`,
            explanation: `Load constant ${node.left.label} into register ${regName}`,
            registerState: `${regName} = ${formatNum(leftVal)}`,
          });
          instructions.push({
            line: lineNum++,
            opcode: mnemonic,
            operands: `${regName}, ${rightRegName}`,
            fullInstruction: `${mnemonic} ${regName}, ${rightRegName}`,
            explanation: `${verb} register ${rightRegName} ${prep} register ${regName}`,
            registerState: `${regName} = ${formatNum(resultVal)}`,
          });
          return resultVal;
        }
      }

      // Case 4: Both Left and Right are compound subtrees (e.g., (2 + 3) * (4 + 1))
      emitSubtree(node.left, regIdx);
      const rightRegIdx = regIdx + 1;
      const rightRegName = `R${rightRegIdx}`;
      emitSubtree(node.right, rightRegIdx);
      instructions.push({
        line: lineNum++,
        opcode: mnemonic,
        operands: `${regName}, ${rightRegName}`,
        fullInstruction: `${mnemonic} ${regName}, ${rightRegName}`,
        explanation: `${verb} register ${regName} ${prep} register ${rightRegName}`,
        registerState: `${regName} = ${formatNum(resultVal)}`,
      });
      return resultVal;
    }

    return 0;
  }

  const targetVar = ast.left!.label;
  const finalVal = emitSubtree(ast.right!, 1);

  instructions.push({
    line: lineNum++,
    opcode: 'STORE',
    operands: `${targetVar}, R1`,
    fullInstruction: `STORE ${targetVar}, R1`,
    explanation: `Store the final value in register R1 (${formatNum(finalVal)}) into memory variable "${targetVar}"`,
    registerState: `${targetVar} = ${formatNum(finalVal)}`,
  });

  return instructions;
}

/**
 * MASTER COMPILER PIPELINE
 * Runs all 6 phases of compilation on the user's input string.
 */
export function compileExpression(rawInput: string): CompilationResult {
  const input = rawInput.trim();

  // Phase 1: Lexical Analysis
  const { tokens, error: lexError } = tokenize(input);
  if (lexError) {
    return {
      input,
      success: false,
      error: lexError,
      tokens,
      lexicalSummary: `Lexical analysis stopped after scanning ${tokens.length} valid token(s) due to an unrecognized token.`,
      syntaxExplanation: [],
      precedenceNote: '',
      semanticPassed: false,
      semanticChecks: [],
      symbolTable: [],
      semanticSummary: '',
      tacInstructions: [],
      tacSummary: '',
      optimizedTacInstructions: [],
      optimizationSteps: [],
      optimizationSummary: '',
      instructionsSaved: 0,
      assemblyInstructions: [],
      assemblySummary: '',
    };
  }

  const lexicalSummary = `Scanned ${input.length} characters and identified ${tokens.length} valid tokens.`;

  // Phase 2: Syntax Analysis
  const parser = new Parser(tokens);
  const { ast, error: synError } = parser.parseStatement();
  if (synError || !ast) {
    return {
      input,
      success: false,
      error: synError,
      tokens,
      lexicalSummary,
      syntaxExplanation: [],
      precedenceNote: '',
      semanticPassed: false,
      semanticChecks: [],
      symbolTable: [],
      semanticSummary: '',
      tacInstructions: [],
      tacSummary: '',
      optimizedTacInstructions: [],
      optimizationSteps: [],
      optimizationSummary: '',
      instructionsSaved: 0,
      assemblyInstructions: [],
      assemblySummary: '',
    };
  }

  const { steps: syntaxExplanation, precedenceNote } = buildSyntaxExplanation(ast, parser.hadParentheses);

  // Phase 3: Semantic Analysis
  const semanticRes = analyzeSemantics(ast);
  if (!semanticRes.passed || semanticRes.error) {
    return {
      input,
      success: false,
      error: semanticRes.error,
      tokens,
      lexicalSummary,
      ast,
      syntaxExplanation,
      precedenceNote,
      semanticPassed: false,
      semanticChecks: semanticRes.checks,
      symbolTable: semanticRes.symbolTable,
      semanticSummary: semanticRes.summary,
      tacInstructions: [],
      tacSummary: '',
      optimizedTacInstructions: [],
      optimizationSteps: [],
      optimizationSummary: '',
      instructionsSaved: 0,
      assemblyInstructions: [],
      assemblySummary: '',
    };
  }

  const targetVariable = ast.left!.label;
  const calculatedResult = semanticRes.evaluatedValue!;

  // Phase 4: Intermediate Code Generation (TAC)
  const tacInstructions = generateTAC(ast);
  const tacSummary = `Generated ${tacInstructions.length} three-address instruction${
    tacInstructions.length > 1 ? 's' : ''
  } using ${Math.max(0, tacInstructions.length - 1)} temporary variable${
    tacInstructions.length - 1 === 1 ? '' : 's'
  }.`;

  // Phase 5: Code Optimization
  const optRes = optimizeTAC(tacInstructions, targetVariable, calculatedResult);

  // Phase 6: Target Code Generation
  const assemblyInstructions = generateAssembly(ast);
  const assemblySummary = `Emitted ${assemblyInstructions.length} pseudo-assembly instructions targeting register R1 and variable "${targetVariable}".`;

  return {
    input,
    success: true,
    targetVariable,
    calculatedResult,
    tokens,
    lexicalSummary,
    ast,
    syntaxExplanation,
    precedenceNote,
    semanticPassed: true,
    semanticChecks: semanticRes.checks,
    symbolTable: semanticRes.symbolTable,
    semanticSummary: semanticRes.summary,
    tacInstructions,
    tacSummary,
    optimizedTacInstructions: optRes.optimizedTac,
    optimizationSteps: optRes.steps,
    optimizationSummary: optRes.summary,
    instructionsSaved: optRes.instructionsSaved,
    assemblyInstructions,
    assemblySummary,
  };
}
