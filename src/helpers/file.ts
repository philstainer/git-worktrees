import fg from "fast-glob";
import { isInsideBareRepository } from "./git";
import { batchPromises, executeCommand } from "./general";
import { ignoredDirectories } from "../config";
import { getPreferences, preferences } from "./raycast";
import { Cache, closeMainWindow, getPreferenceValues, PopToRootType, showToast, Toast } from "@raycast/api";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";

/**
 * Finds all directories matching a given pattern in a given directory and its subdirectories.
 *
 * @param {string} searchDir - The directory to search for directories.
 * @param {number} [depth=getPreferences().maxScanningLevels * 2] - The maximum depth to search for directories.
 * @param {string} pattern - The pattern to match against the directory names.
 * @returns {Promise<string[]>} A promise that resolves to an array of directory paths.
 *
 * @example
 * async function example() {
 *   const searchDir = "/path/to/search";
 *   const pattern = "**\/.bare";
 *   const directories = await findDirectories(searchDir, pattern);
 *   console.log(directories); // Output: ["/path/to/search/dir1/.bare", "/path/to/search/dir2/.bare"]
 * }
 *
 * example();
 */
const findDirectories = async ({
  searchDir,
  depth = getPreferences().maxScanningLevels * 2,
  pattern,
}: {
  searchDir: string;
  depth?: number;
  pattern: string;
}): Promise<string[]> => {
  try {
    const excludedDirectories = ignoredDirectories.map((folder) => `--exclude ${folder}`).join(" ");
    const args = `--glob --full-path --hidden --no-ignore --max-depth=${depth} --type=directory '${pattern}' '${searchDir}' ${excludedDirectories}`;

    let result = "";

    try {
      const { stdout } = await executeCommand(`fd ${args}`);
      result = stdout;
    } catch (err) {
      const { stdout } = await executeCommand(`/opt/homebrew/bin/fd ${args}`);
      result = stdout;
    }

    return result.trim().split("\n");
  } catch (err) {
    return fg(`${searchDir}/${pattern}`, {
      dot: true,
      ignore: ignoredDirectories.map((folder) => `**/${folder}/**`),
      onlyDirectories: true,
      deep: depth,
    });
  }
};

/**
 * Finds all bare repositories in a given directory and its subdirectories.
 *
 * @param {string} searchDir - The directory to search for bare repositories.
 * @returns {Promise<string[]>} A promise that resolves to an array of bare repository paths.
 *
 * @example
 * async function example() {
 *   const searchDir = "/path/to/search";
 *   const bareRepos = await findBareRepos(searchDir);
 *   console.log(bareRepos); // Output: ["/path/to/search/repo1", "/path/to/search/repo2"]
 * }
 *
 * example();
 */
export const findBareRepos = async (searchDir: string): Promise<string[]> => {
  const worktrees = await findDirectories({ searchDir, pattern: "**/.bare" });

  const results = await batchPromises(worktrees, 10, async (path) => {
    const newPath = path.slice(0, path.lastIndexOf("/.bare"));
    const insideBare = await isInsideBareRepository(newPath);
    return insideBare ? newPath : null;
  });

  return results.filter((path) => path !== null);
};

// async function getRepoWorktrees(repoDir: string): Promise<Worktree[]> {
//   const { stdout } = await exec(`git -C '${repoDir}' worktree list --porcelain`);
//   const worktrees = stdout
//     .trim()
//     .split("\n\n")
//     .map((section) => {
//       let worktree: string | null = null;
//       let commit: string | null = null;
//       let branch: string | null = null;
//       section.split("\n").forEach((line) => {
//         if (line.startsWith("worktree ")) {
//           worktree = line.slice(9);
//         } else if (line.startsWith("HEAD ")) {
//           commit = line.slice(5);
//         } else if (line.startsWith("branch refs/heads/")) {
//           branch = line.slice(18);
//         }
//       });
//
//       if (!worktree) {
//         throw new Error("Missing worktree!");
//       }
//       return {
//         path: worktree,
//         commit,
//         branch,
//         dirty: false,
//       };
//     })
//     .filter(({ path }) => path !== repoDir);
//   return Promise.all(
//     worktrees.map(async (worktree) => {
//       const { stdout } = await exec(`git -C '${worktree.path}' status -s`);
//       return {
//         ...worktree,
//         dirty: stdout.trim().length > 0,
//       };
//     }),
//   );
// }

export type Worktree = {
  id: string;
  path: string;
  commit: string | null;
  branch: string | null;
  dirty: boolean;
};

export type Directory = {
  id: string;
  worktrees: Worktree[];
};

export const getRepoWorktrees = async (bareDirectory: string): Promise<Worktree[]> => {
  const { stdout } = await executeCommand(`git worktree list --porcelain`, { cwd: bareDirectory });

  const worktrees = stdout
    .trim()
    .split("\n\n")
    .map((path): Worktree => {
      let worktree: string | null = null;
      let commit: string | null = null;
      let branch: string | null = null;

      path.split("\n").forEach((line) => {
        if (line.startsWith("worktree ")) {
          worktree = line.slice(9);
        } else if (line.startsWith("HEAD ")) {
          commit = line.slice(5);
        } else if (line.startsWith("branch refs/heads/")) {
          branch = line.slice(18);
        }
      });

      if (!worktree) throw new Error("Missing worktree!");

      return {
        id: worktree,
        path: worktree,
        commit,
        branch,
        dirty: false,
      };
    })
    .filter(({ path }) => !path.endsWith(".bare") && path.startsWith(bareDirectory)); // Filter out bare worktree and worktrees that are not in the bare directory e.g have been manually moved

  return batchPromises(worktrees, 25, async (worktree) => ({
    ...worktree,
    dirty: await isWorktreeDirty(worktree.path),
  }));
};

const isWorktreeDirty = async (path: string): Promise<boolean> => {
  try {
    const { stdout } = await executeCommand(`git -C ${path} status -s`);
    return stdout.trim().length > 0;
  } catch (e: unknown) {
    console.error({ path, e });
  }
  return false;
};

export async function getWorktrees(searchDir: string): Promise<Directory[]> {
  const repos = await findBareRepos(searchDir);

  return batchPromises(repos, 15, async (repo) => ({
    id: repo,
    worktrees: await getRepoWorktrees(repo),
  }));
}

export const getWorktreeFromCacheOrFetch = async (searchDir: string) => {
  console.log("1");
  if (!preferences.enableWorktreeCaching) return getWorktrees(searchDir);

  console.log("2");
  const cache = new Cache();
  console.log({ has: cache.has("worktrees") });
  if (cache.has("worktrees")) return JSON.parse(cache.get("worktrees") as string) as Directory[];

  console.log("3");
  const worktrees = await getWorktrees(searchDir);

  cache.remove("worktrees");
  cache.set("worktrees", JSON.stringify(worktrees));

  console.log("4");
  console.log({ has: cache.has("worktrees") });

  return worktrees;
};

export function clearCache() {
  const cache = new Cache();
  return cache.remove("worktrees");
}

const home = `${homedir()}/`;

// // Return the directory containing the git repos specified in preferences
// export function getRootDir(): string {
//   const { projectsPath } = getPreferences();
//   return projectsPath.replace("~/", home);
// }

// Prettify a path for display in the UI
export function formatPath(path: string): string {
  if (path.startsWith(home)) {
    return path.replace(home, "~/");
  }
  return path;
}
