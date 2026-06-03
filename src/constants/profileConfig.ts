import { AIProvider } from "@/services/ai/aiServices";

export const PROFILE_LANGUAGES = [
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

export const AI_PROVIDERS: { id: AIProvider; label: string; icon: string }[] = [
  { id: "gemini", label: "Gemini", icon: "google" },
  { id: "openai", label: "OpenAI", icon: "robot-outline" },
  { id: "claude", label: "Claude", icon: "brain" },
];

export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  gemini: ["gemini-3.1-pro", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3-pro-preview"],
  openai: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
  claude: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"],
};
