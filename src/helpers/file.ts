import fg from "fast-glob";
import { isInsideBareRepository, parseGitRemotes } from "./git";
import { batchPromises, executeCommand } from "./general";
import { ignoredDirectories } from "#/config";
import { getPreferences, preferences } from "./raycast";
import { Cache } from "@raycast/api";
import { homedir } from "node:os";
import { BareRepository, Project, Worktree } from "#/config/types";
import { CACHE_KEYS } from "#/config/constants";
import { statSync } from "node:fs";

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

export const findBareRepos = async (searchDir: string): Promise<BareRepository[]> => {
  const bareRepositories = await findDirectories({ searchDir, pattern: "**/.bare" });

  const validBareRepos = (
    await batchPromises(bareRepositories, 10, async (path) => {
      const newPath = path.slice(0, path.lastIndexOf("/.bare"));
      const insideBare = await isInsideBareRepository(newPath);
      return insideBare ? newPath : null;
    })
  ).filter((path) => path !== null);

  return batchPromises(validBareRepos, 10, async (path) => {
    const pathParts = path.split("/").slice(3);

    return {
      name: pathParts.at(-1) || "",
      displayPath: formatPath(path),
      fullPath: path,
      pathParts,
      primaryDirectory: pathParts.at(-2) || "",
      gitRemotes: await parseGitRemotes(path),
    };
  });
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

export async function getWorktrees(searchDir: string): Promise<Project[]> {
  const repos = await getDirectoriesFromCacheOrFetch(searchDir);

  return batchPromises(repos, 15, async (repo) => ({
    ...repo,
    id: repo.fullPath,
    worktrees: await getRepoWorktrees(repo.fullPath),
  }));
}

export const getDirectoriesFromCacheOrFetch = async (searchDir: string) => {
  if (!preferences.enableWorktreeCaching) return findBareRepos(searchDir);

  const cache = new Cache();
  if (cache.has("directories")) return JSON.parse(cache.get("directories") as string) as BareRepository[];

  const directories = await findBareRepos(searchDir);
  cache.remove("directories");
  cache.set("directories", JSON.stringify(directories));

  return directories;
};

export const getWorktreeFromCacheOrFetch = async (searchDir: string) => {
  if (!preferences.enableWorktreeCaching) return getWorktrees(searchDir);

  const cache = new Cache();
  if (cache.has(CACHE_KEYS.WORKTREES)) return JSON.parse(cache.get(CACHE_KEYS.WORKTREES) as string) as Project[];

  const worktrees = await getWorktrees(searchDir);
  cache.remove(CACHE_KEYS.WORKTREES);
  cache.set(CACHE_KEYS.WORKTREES, JSON.stringify(worktrees));

  return worktrees;
};

export function clearCache() {
  const cache = new Cache();
  cache.remove(CACHE_KEYS.DIRECTORIES);
  cache.remove(CACHE_KEYS.WORKTREES);
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

/**
 * Checks if the provided path is an existing directory
 * @param {string} path - The path to be checked
 * @returns {boolean} True if the path is an existing directory, otherwise false
 */
export const isExistingDirectory = (path: string): boolean => {
  try {
    const newPath = statSync(path);
    return newPath?.isDirectory();
  } catch {
    return false;
  }
};
