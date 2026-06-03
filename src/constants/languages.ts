export interface LanguageOption {
  id: string;
  label: string;
  icon: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: "ts", label: "TypeScript", icon: "language-typescript" },
  { id: "js", label: "JavaScript", icon: "language-javascript" },
  { id: "py", label: "Python", icon: "language-python" },
  { id: "java", label: "Java", icon: "language-java" },
  { id: "go", label: "Go", icon: "language-go" },
  { id: "kt", label: "Kotlin", icon: "language-kotlin" },
  { id: "swift", label: "Swift", icon: "language-swift" },
  { id: "cs", label: "C#", icon: "language-csharp" },
  { id: "cpp", label: "C++", icon: "language-cpp" },
  { id: "rs", label: "Rust", icon: "language-rust" },
  { id: "rb", label: "Ruby", icon: "language-ruby" },
  { id: "php", label: "PHP", icon: "language-php" },
];
