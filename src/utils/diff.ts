export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

/**
 * Computes a line-by-line diff between two strings using the Longest Common Subsequence (LCS) algorithm.
 */
export function computeDiff(original: string, modified: string): DiffLine[] {
  const one = original.split("\n");
  const two = modified.split("\n");

  const dp: number[][] = Array(one.length + 1)
    .fill(0)
    .map(() => Array(two.length + 1).fill(0));

  for (let i = 1; i <= one.length; i++) {
    for (let j = 1; j <= two.length; j++) {
      if (one[i - 1] === two[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = one.length;
  let j = two.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && one[i - 1] === two[j - 1]) {
      diff.unshift({ type: "unchanged", content: one[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: "added", content: two[j - 1] });
      j--;
    } else {
      diff.unshift({ type: "removed", content: one[i - 1] });
      i--;
    }
  }

  return diff;
}
