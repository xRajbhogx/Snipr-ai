import { File, Directory, Paths } from "expo-file-system";

/**
 * Calculates the size of a Directory recursively.
 */
function getDirectorySize(dir: Directory): number {
  let totalSize = 0;
  try {
    if (!dir.exists) return 0;
    const items = dir.list();
    for (const item of items) {
      if (item instanceof Directory) {
        totalSize += getDirectorySize(item);
      } else if (item instanceof File) {
        totalSize += item.size || 0;
      }
    }
  } catch (error) {
    console.error("Failed to calculate directory size:", error);
  }
  return totalSize;
}

/**
 * Calculates the size of a file or directory recursively.
 * @param uri The URI of the file or directory.
 */
export async function getUriSize(uri: string): Promise<number> {
  try {
    const pathInfo = Paths.info(uri);
    if (!pathInfo.exists) return 0;

    if (pathInfo.isDirectory) {
      const dir = new Directory(uri);
      return getDirectorySize(dir);
    } else {
      const file = new File(uri);
      return file.size || 0;
    }
  } catch (error) {
    console.error(`Failed to calculate size for ${uri}:`, error);
    return 0;
  }
}

/**
 * Gets the database size in bytes.
 */
export async function getDatabaseSize(): Promise<number> {
  try {
    const dbFile = new File(Paths.document, "SQLite", "snipr.db");
    return dbFile.exists ? dbFile.size : 0;
  } catch (error) {
    console.error("Failed to get database size:", error);
    return 0;
  }
}

/**
 * Gets the cache directory size in bytes.
 */
export async function getCacheSize(): Promise<number> {
  try {
    const cacheDir = Paths.cache;
    return getDirectorySize(cacheDir);
  } catch (error) {
    console.error("Failed to get cache size:", error);
    return 0;
  }
}

/**
 * Clears the application cache directory.
 */
export async function clearAppCache(): Promise<void> {
  try {
    const cacheDir = Paths.cache;
    if (cacheDir.exists) {
      const items = cacheDir.list();
      for (const item of items) {
        item.delete();
      }
    }
  } catch (error) {
    console.error("Failed to clear cache:", error);
    throw error;
  }
}

/**
 * Formats a size in bytes into a human-readable string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return "0.00 KB";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
