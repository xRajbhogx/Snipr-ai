import * as FileSystem from "expo-file-system/legacy";

// ==========================================
// Custom Error Classes
// ==========================================

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found at path: ${path}`);
    this.name = "FileNotFoundError";
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}

export class DirectoryNotFoundError extends Error {
  constructor(directory: string) {
    super(`Directory not found: ${directory}`);
    this.name = "DirectoryNotFoundError";
    Object.setPrototypeOf(this, DirectoryNotFoundError.prototype);
  }
}

export class FileOperationError extends Error {
  public originalError: any;
  constructor(operation: string, path: string, originalError: any) {
    super(
      `Failed to perform operation '${operation}' on path: ${path}. Error: ${originalError?.message || originalError}`,
    );
    this.name = "FileOperationError";
    this.originalError = originalError;
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}

// ==========================================
// Type Definitions
// ==========================================

export interface FileItem {
  name: string;
  path: string;
  size: number;
  modifiedAt: number; // JavaScript millisecond timestamp
  extension: string;
}

export type DirectoryType = "exports" | "images" | "downloads" | "temp";

export interface StorageStats {
  totalSize: number;
  exportsSize: number;
  imagesSize: number;
  downloadsSize: number;
  tempSize: number;
}

export interface DownloadResult {
  uri: string;
  status: number;
  headers: Record<string, string>;
  mimeType: string | null;
}

// ==========================================
// Base Directory Constants
// ==========================================

export const DOCUMENTS_DIR = `${FileSystem.documentDirectory}Documents/`;
export const EXPORTS_DIR = `${DOCUMENTS_DIR}exports/`;
export const IMAGES_DIR = `${DOCUMENTS_DIR}images/`;
export const DOWNLOADS_DIR = `${DOCUMENTS_DIR}downloads/`;
export const TEMP_DIR = `${DOCUMENTS_DIR}temp/`;

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  python: "py",
  py: "py",
  dart: "dart",
  json: "json",
  sql: "sql",
  text: "txt",
  txt: "txt",
  html: "html",
  css: "css",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  cs: "cs",
  go: "go",
  rust: "rs",
  rs: "rs",
  ruby: "rb",
  rb: "rb",
  php: "php",
  swift: "swift",
  kotlin: "kt",
  kt: "kt",
  bash: "sh",
  sh: "sh",
  yaml: "yml",
  yml: "yml",
  markdown: "md",
  md: "md",
};

const CODE_FILE_EXTENSIONS = new Set<string>([
  ...Object.values(LANGUAGE_EXTENSIONS),
  "yaml",
]);

// ==========================================
// Storage Utilities
// ==========================================

/**
 * Resolves DirectoryType enum to absolute path URI
 */
export function getDirectoryPath(directory: DirectoryType): string {
  switch (directory) {
    case "exports":
      return EXPORTS_DIR;
    case "images":
      return IMAGES_DIR;
    case "downloads":
      return DOWNLOADS_DIR;
    case "temp":
      return TEMP_DIR;
    default:
      throw new Error(`Unknown directory type: ${directory}`);
  }
}

/**
 * Formats bytes to human-readable size string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Extracts lowercase file extension from path/filename
 */
export function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length <= 1) return "";
  return parts.pop()?.toLowerCase() || "";
}

/**
 * Generates a collision-resistant unique file name
 */
export function generateFileName(extension: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const cleanExt = extension.startsWith(".") ? extension.slice(1) : extension;
  return prefix
    ? `${prefix}_${timestamp}_${random}.${cleanExt}`
    : `${timestamp}_${random}.${cleanExt}`;
}

/**
 * Sanitizes file name by removing characters incompatible with standard filesystems
 */
export function sanitizeFileName(fileName: string): string {
  const ext = getExtension(fileName);
  const base = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const sanitizedBase = base.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return ext ? `${sanitizedBase}.${ext}` : sanitizedBase;
}

/**
 * Checks if extension of file represents a standard image format
 */
export function isImageFile(fileName: string): boolean {
  const ext = getExtension(fileName);
  return ["png", "jpg", "jpeg", "gif", "bmp", "webp", "heic"].includes(ext);
}

/**
 * Checks if extension of file represents a known code/text format
 */
export function isCodeFile(fileName: string): boolean {
  const ext = getExtension(fileName);
  return CODE_FILE_EXTENSIONS.has(ext);
}

// ==========================================
// Core APIs
// ==========================================

/**
 * Initializes the root Documents/ folder structure and all nested directories
 */
export async function initializeFileSystem(): Promise<void> {
  const dirs = [
    DOCUMENTS_DIR,
    EXPORTS_DIR,
    IMAGES_DIR,
    DOWNLOADS_DIR,
    TEMP_DIR,
  ];
  try {
    for (const dir of dirs) {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
  } catch (error) {
    throw new FileOperationError("initializeFileSystem", DOCUMENTS_DIR, error);
  }
}

/**
 * Creates a file with string content in the specified app subdirectory
 */
export async function createFile(
  fileName: string,
  content: string,
  directory: DirectoryType,
): Promise<string> {
  const sanitized = sanitizeFileName(fileName);
  const dirPath = getDirectoryPath(directory);
  const filePath = `${dirPath}${sanitized}`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      throw new DirectoryNotFoundError(directory);
    }
    await FileSystem.writeAsStringAsync(filePath, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return filePath;
  } catch (error) {
    if (error instanceof DirectoryNotFoundError) {
      throw error;
    }
    throw new FileOperationError("createFile", filePath, error);
  }
}

/**
 * Reads the text content of a file
 */
export async function readFile(path: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      throw new FileNotFoundError(path);
    }
    return await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("readFile", path, error);
  }
}

/**
 * Updates the text content of an existing file
 */
export async function updateFile(
  path: string,
  content: string,
): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      throw new FileNotFoundError(path);
    }
    await FileSystem.writeAsStringAsync(path, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return path;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("updateFile", path, error);
  }
}

/**
 * Deletes a file at the specified absolute local path URI
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      throw new FileNotFoundError(path);
    }
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("deleteFile", path, error);
  }
}

/**
 * Lists all file items inside a specified app subdirectory (excludes directories)
 */
export async function listFiles(directory: DirectoryType): Promise<FileItem[]> {
  const dirPath = getDirectoryPath(directory);
  try {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      throw new DirectoryNotFoundError(directory);
    }
    const fileNames = await FileSystem.readDirectoryAsync(dirPath);
    const fileItems: FileItem[] = [];

    for (const name of fileNames) {
      const filePath = `${dirPath}${name}`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists && !info.isDirectory) {
        fileItems.push({
          name,
          path: filePath,
          size: info.size || 0,
          modifiedAt: (info.modificationTime || Date.now() / 1000) * 1000,
          extension: getExtension(name),
        });
      }
    }

    // Sort files by modification date descending (newest first)
    return fileItems.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    if (error instanceof DirectoryNotFoundError) {
      throw error;
    }
    throw new FileOperationError("listFiles", dirPath, error);
  }
}

/**
 * Fetches filesystem metadata for a specific path URI
 */
export async function getFileInfo(path: string): Promise<FileItem> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      throw new FileNotFoundError(path);
    }
    const name = path.split("/").pop() || "";
    return {
      name,
      path,
      size: info.size || 0,
      modifiedAt: (info.modificationTime || Date.now() / 1000) * 1000,
      extension: getExtension(name),
    };
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("getFileInfo", path, error);
  }
}

/**
 * Helper to get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) return "";
  const parts = mimeType.split("/");
  if (parts.length < 2) return "";
  const subType = parts[1].toLowerCase();

  switch (subType) {
    case "jpeg":
    case "jpg":
      return "jpg";
    case "png":
      return "png";
    case "gif":
      return "gif";
    case "webp":
      return "webp";
    case "bmp":
      return "bmp";
    case "heic":
      return "heic";
    case "json":
      return "json";
    case "javascript":
    case "x-javascript":
      return "js";
    case "typescript":
      return "ts";
    case "plain":
      return "txt";
    case "html":
      return "html";
    case "css":
      return "css";
    case "xml":
      return "xml";
    default:
      return "";
  }
}

/**
 * Downloads a file from URL to local storage. Destination can be a DirectoryType or absolute path URI.
 */
export async function downloadFile(
  url: string,
  destination: DirectoryType | string,
): Promise<DownloadResult> {
  let targetPath = "";
  if (
    destination === "exports" ||
    destination === "images" ||
    destination === "downloads" ||
    destination === "temp"
  ) {
    const rawFilename =
      url.split("/").pop()?.split("?")[0] || `download_${Date.now()}`;
    const filename = sanitizeFileName(rawFilename);
    targetPath = `${getDirectoryPath(destination)}${filename}`;
  } else {
    targetPath = destination;
  }

  try {
    const result = await FileSystem.downloadAsync(url, targetPath);
    
    // Auto-detect and append extension if missing based on mimeType
    let finalPath = targetPath;
    const currentExt = getExtension(targetPath);
    if (result.status === 200 && !currentExt && result.mimeType) {
      const suggestedExt = getExtensionFromMimeType(result.mimeType);
      if (suggestedExt) {
        finalPath = `${targetPath}.${suggestedExt}`;
        await FileSystem.moveAsync({ from: targetPath, to: finalPath });
      }
    }

    return {
      uri: finalPath,
      status: result.status,
      headers: (result.headers || {}) as Record<string, string>,
      mimeType: result.mimeType || null,
    };
  } catch (error) {
    throw new FileOperationError("downloadFile", targetPath, error);
  }
}

/**
 * Copies a file from source absolute path URI to destination absolute path URI
 */
export async function copyFile(
  source: string,
  destination: string,
): Promise<string> {
  try {
    const sourceInfo = await FileSystem.getInfoAsync(source);
    if (!sourceInfo.exists) {
      throw new FileNotFoundError(source);
    }
    await FileSystem.copyAsync({ from: source, to: destination });
    return destination;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("copyFile", destination, error);
  }
}

/**
 * Moves a file from source absolute path URI to destination absolute path URI
 */
export async function moveFile(
  source: string,
  destination: string,
): Promise<string> {
  try {
    const sourceInfo = await FileSystem.getInfoAsync(source);
    if (!sourceInfo.exists) {
      throw new FileNotFoundError(source);
    }
    await FileSystem.moveAsync({ from: source, to: destination });
    return destination;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("moveFile", destination, error);
  }
}

/**
 * Clears all files inside the temporary directory
 */
export async function clearTempFiles(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TEMP_DIR);
    if (!dirInfo.exists) {
      return;
    }
    const files = await FileSystem.readDirectoryAsync(TEMP_DIR);
    for (const file of files) {
      const filePath = `${TEMP_DIR}${file}`;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    throw new FileOperationError("clearTempFiles", TEMP_DIR, error);
  }
}

// ==========================================
// Recursive Storage Analytics
// ==========================================

/**
 * Helper to recursively calculate size of a directory
 */
async function getDirectorySizeRecursively(dirPath: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      return 0;
    }
    if (!info.isDirectory) {
      return info.size || 0;
    }

    const items = await FileSystem.readDirectoryAsync(dirPath);
    let total = 0;
    for (const item of items) {
      const itemPath = dirPath.endsWith("/")
        ? `${dirPath}${item}`
        : `${dirPath}/${item}`;
      const itemInfo = await FileSystem.getInfoAsync(itemPath);
      if (itemInfo.exists) {
        if (itemInfo.isDirectory) {
          total += await getDirectorySizeRecursively(itemPath);
        } else {
          total += itemInfo.size || 0;
        }
      }
    }
    return total;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculates current filesystem usage for all subdirectories recursively
 */
export async function getStorageUsage(): Promise<StorageStats> {
  try {
    const exportsSize = await getDirectorySizeRecursively(EXPORTS_DIR);
    const imagesSize = await getDirectorySizeRecursively(IMAGES_DIR);
    const downloadsSize = await getDirectorySizeRecursively(DOWNLOADS_DIR);
    const tempSize = await getDirectorySizeRecursively(TEMP_DIR);
    const totalSize = await getDirectorySizeRecursively(DOCUMENTS_DIR);

    return {
      totalSize,
      exportsSize,
      imagesSize,
      downloadsSize,
      tempSize,
    };
  } catch (error) {
    throw new FileOperationError("getStorageUsage", DOCUMENTS_DIR, error);
  }
}

// ==========================================
// Snippet Export Support
// ==========================================

/**
 * Exports a code snippet as a local file in Documents/exports/
 */
export async function exportSnippetAsFile(
  title: string,
  code: string,
  language: string,
): Promise<string> {
  const languageKey = language.toLowerCase();
  const ext = LANGUAGE_EXTENSIONS[languageKey] || "txt";
  const baseName = sanitizeFileName(title);
  const fileName = baseName
    ? baseName.endsWith(`.${ext}`)
      ? baseName
      : `${baseName}.${ext}`
    : `snippet_${Date.now()}.${ext}`;
  return await createFile(fileName, code, "exports");
}

// ==========================================
// Screenshot Support
// ==========================================

/**
 * Moves local image picking assets to local storage image vault Documents/images/
 */
export async function saveSnippetImage(
  imageUri: string,
  customTitle?: string,
): Promise<string> {
  try {
    const sourceInfo = await FileSystem.getInfoAsync(imageUri);
    if (!sourceInfo.exists) {
      throw new FileNotFoundError(imageUri);
    }
    const ext = getExtension(imageUri) || "png";

    let filename = "";
    if (customTitle) {
      const cleanTitle = customTitle.replace(/[^a-zA-Z0-9_\-]/g, "_");
      filename = `${cleanTitle}.${ext}`;
    } else {
      filename = generateFileName(ext, "screenshot");
    }

    const destPath = `${IMAGES_DIR}${filename}`;

    try {
      await FileSystem.moveAsync({ from: imageUri, to: destPath });
    } catch (moveError) {
      // Fallback: copy and delete if standard move is not supported (e.g. cross-volume links)
      await FileSystem.copyAsync({ from: imageUri, to: destPath });
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      } catch (deleteError) {
        // Ignore
      }
    }

    return destPath;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("saveSnippetImage", imageUri, error);
  }
}

/**
 * Renames or moves a local file keeping its original extension and directory
 */
export async function renameFile(
  oldPath: string,
  newBaseName: string,
): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(oldPath);
    if (!info.exists) {
      throw new FileNotFoundError(oldPath);
    }
    const dirPath = oldPath.substring(0, oldPath.lastIndexOf("/") + 1);
    const ext = getExtension(oldPath);
    const cleanBase = newBaseName.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const newPath = `${dirPath}${cleanBase}${ext ? `.${ext}` : ""}`;

    if (oldPath === newPath) return oldPath;

    // Check if destination already exists to avoid overwrite or handle it
    const destInfo = await FileSystem.getInfoAsync(newPath);
    if (destInfo.exists) {
      // If it exists, append a small random string to make it unique but still descriptive
      const random = Math.floor(Math.random() * 1000);
      const uniquePath = `${dirPath}${cleanBase}_${random}${ext ? `.${ext}` : ""}`;
      await FileSystem.moveAsync({ from: oldPath, to: uniquePath });
      return uniquePath;
    }

    await FileSystem.moveAsync({ from: oldPath, to: newPath });
    return newPath;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      throw error;
    }
    throw new FileOperationError("renameFile", oldPath, error);
  }
}

/**
 * Deletes the entire Documents directory and recreates the initial directory structure.
 */
export async function wipeFileSystem(): Promise<void> {
  try {
    await FileSystem.deleteAsync(DOCUMENTS_DIR, { idempotent: true });
    await initializeFileSystem();
  } catch (error) {
    throw new FileOperationError("wipeFileSystem", DOCUMENTS_DIR, error);
  }
}

/**
 * Deletes the SQLite database folder completely.
 */
export async function wipeDatabaseFile(): Promise<void> {
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    await FileSystem.deleteAsync(dbDir, { idempotent: true });
  } catch (error) {
    throw new FileOperationError("wipeDatabaseFile", "SQLite", error);
  }
}
