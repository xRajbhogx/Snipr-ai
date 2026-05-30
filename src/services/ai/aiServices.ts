import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { generateClaudeContent } from "./providers/claude";
import { generateGeminiContent } from "./providers/gemini";
import { generateOpenAIContent } from "./providers/openai";
import { AI_PROMPTS } from "./prompts";

export type AIProvider = "gemini" | "openai" | "claude";

export interface AIServiceConfig {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

// Storage keys
const PROVIDER_STORAGE_KEY = "@snipr_ai_provider";
const getModelStorageKey = (provider: AIProvider) => `@snipr_ai_model_${provider}`;
const getSecureApiKey = (provider: AIProvider) => `snipr_${provider}_api_key`;

/**
 * Gets the selected AI provider from AsyncStorage. Defaults to 'gemini'.
 */
export async function getStoredAIProvider(): Promise<AIProvider> {
  try {
    const provider = await AsyncStorage.getItem(PROVIDER_STORAGE_KEY);
    return (provider as AIProvider) || "gemini";
  } catch {
    return "gemini";
  }
}

/**
 * Saves the selected AI provider to AsyncStorage.
 */
export async function setStoredAIProvider(provider: AIProvider): Promise<void> {
  try {
    await AsyncStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    // Silent fail
  }
}

/**
 * Gets the preferred model for a given provider.
 */
export async function getStoredModel(provider: AIProvider): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(getModelStorageKey(provider));
  } catch {
    return null;
  }
}

/**
 * Saves the preferred model for a given provider.
 */
export async function setStoredModel(provider: AIProvider, model: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getModelStorageKey(provider), model);
  } catch {
    // Silent fail
  }
}

/**
 * Gets the API key securely.
 */
export async function getStoredAPIKey(provider: AIProvider): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(getSecureApiKey(provider));
    }
    return await SecureStore.getItemAsync(getSecureApiKey(provider));
  } catch {
    return null;
  }
}

/**
 * Saves the API key securely.
 */
export async function setStoredAPIKey(provider: AIProvider, apiKey: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(getSecureApiKey(provider), apiKey);
      return;
    }
    await SecureStore.setItemAsync(getSecureApiKey(provider), apiKey);
  } catch (error) {
    throw error;
  }
}

/**
 * Clears the API key securely.
 */
export async function clearStoredAPIKey(provider: AIProvider): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(getSecureApiKey(provider));
      return;
    }
    await SecureStore.deleteItemAsync(getSecureApiKey(provider));
  } catch (error) {
    throw error;
  }
}

/**
 * General helper to execute any prompt task on the configured AI provider.
 */
export async function executeAITask(
  prompt: string,
  systemInstruction: string,
  config?: AIServiceConfig
): Promise<string> {
  const provider = config?.provider || (await getStoredAIProvider());
  const apiKey = config?.apiKey || (await getStoredAPIKey(provider)) || "";
  const model = config?.model || (await getStoredModel(provider)) || undefined;
  const temperature = config?.temperature;

  if (!apiKey) {
    throw new Error(`API Key is missing for ${provider}. Please configure it in Settings.`);
  }

  switch (provider) {
    case "gemini":
      return generateGeminiContent(prompt, systemInstruction, {
        apiKey,
        model,
        temperature,
      });
    case "openai":
      return generateOpenAIContent(prompt, systemInstruction, {
        apiKey,
        model,
        temperature,
      });
    case "claude":
      return generateClaudeContent(prompt, systemInstruction, {
        apiKey,
        model,
      });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Generates an explanation for a code snippet.
 */
export async function explainCode(
  code: string,
  language?: string,
  config?: AIServiceConfig
): Promise<string> {
  const prompt = AI_PROMPTS.explain.user(code, language);
  const systemInstruction = AI_PROMPTS.explain.system;
  return executeAITask(prompt, systemInstruction, config);
}

/**
 * Generates a summary for a code snippet.
 */
export async function summarizeCode(
  code: string,
  language?: string,
  config?: AIServiceConfig
): Promise<string> {
  const prompt = AI_PROMPTS.summarize.user(code, language);
  const systemInstruction = AI_PROMPTS.summarize.system;
  return executeAITask(prompt, systemInstruction, config);
}

/**
 * Generates improvement suggestions for a code snippet.
 */
export async function suggestImprovements(
  code: string,
  language?: string,
  config?: AIServiceConfig
): Promise<string> {
  const prompt = AI_PROMPTS.improve.user(code, language);
  const systemInstruction = AI_PROMPTS.improve.system;
  return executeAITask(prompt, systemInstruction, config);
}
