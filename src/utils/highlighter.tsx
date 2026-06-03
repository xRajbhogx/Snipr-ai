import React from "react";
import { Text, StyleSheet } from "react-native";
import { Theme } from "@/constants/theme";

export interface Token {
  type: "keyword" | "type" | "string" | "number" | "comment" | "function" | "operator" | "text";
  value: string;
}

const keywordsMap: Record<string, string[]> = {
  js: ["const", "let", "var", "function", "return", "class", "import", "export", "from", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "new", "this", "typeof", "instanceof", "in", "of", "try", "catch", "finally", "throw", "async", "await", "yield", "super", "constructor", "null", "undefined", "true", "false"],
  ts: ["const", "let", "var", "function", "return", "class", "import", "export", "from", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "new", "this", "typeof", "instanceof", "in", "of", "try", "catch", "finally", "throw", "async", "await", "yield", "super", "constructor", "public", "private", "protected", "static", "readonly", "interface", "type", "extends", "implements", "package", "namespace", "declare", "as", "keyof", "any", "unknown", "never", "void", "null", "undefined", "true", "false"],
  py: ["def", "class", "return", "if", "elif", "else", "for", "while", "break", "continue", "pass", "import", "from", "as", "in", "is", "and", "or", "not", "lambda", "try", "except", "finally", "raise", "assert", "with", "yield", "global", "nonlocal", "del", "None", "True", "False"],
  java: ["public", "private", "protected", "class", "interface", "enum", "extends", "implements", "import", "package", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "new", "this", "super", "try", "catch", "finally", "throw", "throws", "static", "final", "abstract", "synchronized", "volatile", "transient", "instanceof", "void", "null", "true", "false"],
  kt: ["fun", "val", "var", "class", "interface", "object", "return", "if", "else", "for", "while", "do", "when", "break", "continue", "default", "import", "package", "this", "super", "try", "catch", "finally", "throw", "null", "true", "false", "is", "as", "in"],
  go: ["package", "import", "func", "return", "var", "const", "type", "struct", "interface", "map", "chan", "go", "select", "defer", "if", "else", "for", "range", "switch", "case", "default", "fallthrough", "break", "continue", "goto", "nil", "true", "false"],
  swift: ["import", "class", "struct", "enum", "protocol", "extension", "func", "var", "let", "init", "self", "return", "if", "guard", "else", "switch", "case", "default", "for", "in", "while", "repeat", "break", "continue", "fallthrough", "try", "catch", "throw", "nil", "true", "false"],
  cs: ["using", "namespace", "class", "struct", "enum", "interface", "public", "private", "protected", "internal", "static", "readonly", "volatile", "virtual", "override", "sealed", "abstract", "return", "if", "else", "for", "foreach", "while", "do", "switch", "case", "break", "continue", "default", "new", "this", "base", "try", "catch", "finally", "throw", "null", "true", "false", "var", "get", "set"],
  cpp: ["include", "define", "namespace", "using", "class", "struct", "enum", "union", "public", "private", "protected", "static", "const", "constexpr", "virtual", "override", "final", "inline", "template", "typename", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "new", "delete", "this", "try", "catch", "throw", "nullptr", "true", "false"],
  rs: ["fn", "let", "mut", "const", "static", "struct", "enum", "trait", "impl", "use", "mod", "pub", "return", "if", "else", "match", "for", "in", "while", "loop", "break", "continue", "unsafe", "as", "where", "type", "self", "Self", "true", "false"],
  rb: ["def", "class", "module", "end", "return", "if", "elsif", "else", "unless", "for", "in", "while", "until", "loop", "break", "next", "redo", "retry", "begin", "rescue", "ensure", "raise", "nil", "true", "false", "and", "or", "not"],
  php: ["function", "class", "interface", "trait", "extends", "implements", "public", "private", "protected", "static", "final", "abstract", "return", "if", "else", "elseif", "foreach", "for", "while", "do", "switch", "case", "break", "continue", "default", "new", "clone", "try", "catch", "finally", "throw", "namespace", "use", "echo", "print", "die", "exit", "empty", "isset", "unset", "include", "require", "include_once", "require_once", "null", "true", "false"]
};

// Pre-compute keyword Sets at module load — avoids rebuilding per tokenize() call
const keywordsSets: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(keywordsMap).map(([lang, words]) => [lang, new Set(words)])
);

const commonTypes = new Set([
  "string", "number", "boolean", "any", "unknown", "never", "void",
  "int", "float", "double", "char", "bool", "long", "short", "byte",
  "String", "Number", "Boolean", "Array", "Map", "Set", "Promise",
  "Object", "Function", "Error", "Console", "console", "list", "dict",
  "tuple", "set", "int", "float", "str", "bool"
]);

const TOKEN_REGEX = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)|([+\-*\/%&|^!~?:]=|[-+*\/%&|^!~?:<>=]=?|&&|\|\||\*\*|=>|[{}()\[\].,;])|(\s+)|(.)/g;

const normalizeLanguage = (langLabel: string): string => {
  const label = langLabel.toLowerCase();
  if (label.includes("typescript") || label === "ts") return "ts";
  if (label.includes("javascript") || label === "js") return "js";
  if (label.includes("python") || label === "py") return "py";
  if (label.includes("java") && !label.includes("javascript")) return "java";
  if (label.includes("go")) return "go";
  if (label.includes("kotlin") || label === "kt") return "kt";
  if (label.includes("swift")) return "swift";
  if (label.includes("c#") || label === "cs" || label === "csharp") return "cs";
  if (label.includes("c++") || label === "cpp") return "cpp";
  if (label.includes("rust") || label === "rs") return "rs";
  if (label.includes("ruby") || label === "rb") return "rb";
  if (label.includes("php")) return "php";
  return "js";
};

interface IntermediateToken {
  type: Token["type"] | "word";
  value: string;
}

export function tokenize(code: string, languageLabel: string): Token[] {
  const langKey = normalizeLanguage(languageLabel);
  const keywordsSet = keywordsSets[langKey] || keywordsSets.js;

  const tokens: IntermediateToken[] = [];
  let match;
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ type: "comment", value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: "string", value: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: "number", value: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: "word", value: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: "operator", value: match[5] });
    } else if (match[6] !== undefined) {
      tokens.push({ type: "text", value: match[6] });
    } else if (match[7] !== undefined) {
      tokens.push({ type: "text", value: match[7] });
    }
  }

  const refinedTokens: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "word") {
      const val = token.value;

      // Determine if it is a function name (followed by optional spaces and open parenthesis)
      let isFn = false;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].value.trim() === "") {
          continue;
        }
        if (tokens[j].value === "(") {
          isFn = true;
        }
        break;
      }

      if (isFn) {
        refinedTokens.push({ type: "function", value: val });
      } else if (keywordsSet.has(val)) {
        refinedTokens.push({ type: "keyword", value: val });
      } else if (commonTypes.has(val)) {
        refinedTokens.push({ type: "type", value: val });
      } else {
        refinedTokens.push({ type: "text", value: val });
      }
    } else {
      refinedTokens.push(token as Token);
    }
  }

  return refinedTokens;
}

// Cache StyleSheet output per theme object — avoids re-registering styles on every highlight call
const tokenStyleCache = new WeakMap<Theme, ReturnType<typeof createTokenStyles>>();

function createTokenStyles(theme: Theme) {
  return StyleSheet.create({
    keyword: { color: theme.syntaxKeyword, fontFamily: "monospace", includeFontPadding: false },
    comment: { color: theme.syntaxComment, fontFamily: "monospace", includeFontPadding: false },
    string: { color: theme.syntaxString, fontFamily: "monospace", includeFontPadding: false },
    type: { color: theme.syntaxType, fontFamily: "monospace", includeFontPadding: false },
    number: { color: theme.syntaxNumber, fontFamily: "monospace", includeFontPadding: false },
    function: { color: theme.syntaxFunction, fontFamily: "monospace", includeFontPadding: false },
    operator: { color: theme.syntaxOperator, fontFamily: "monospace", includeFontPadding: false },
    text: { color: theme.syntaxText, fontFamily: "monospace", includeFontPadding: false },
  });
}

function getTokenStyles(theme: Theme) {
  let cached = tokenStyleCache.get(theme);
  if (!cached) {
    cached = createTokenStyles(theme);
    tokenStyleCache.set(theme, cached);
  }
  return cached;
}

export function renderHighlightedCode(code: string, languageLabel: string, theme: Theme) {
  const tokens = tokenize(code, languageLabel);
  const tokenStyles = getTokenStyles(theme);

  return tokens.map((token, index) => {
    const style = tokenStyles[token.type] || tokenStyles.text;
    return (
      <Text key={index} style={style}>
        {token.value}
      </Text>
    );
  });
}
