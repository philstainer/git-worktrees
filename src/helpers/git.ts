import { executeCommand, removeNewLine } from "./general";
import { BARE_REPOSITORY_REMOTE_ORIGIN_FETCH } from "#/config/constants";
import { Icon, Image } from "@raycast/api";
import gitConfigParser from "parse-git-config";
import parseUrl from "parse-url";

/**
 * Checks if a given path is inside a bare repository.
 *
 * @param {string} path - The path to check.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the path is inside a bare repository.
 */
export const isInsideBareRepository = async (path: string): Promise<boolean> => {
  try {
    const command = `git rev-parse --is-bare-repository`;
    const { stdout } = await executeCommand(command, { cwd: path });

    const result = removeNewLine(stdout);

    return result === "true";
  } catch (e: unknown) {
    return false;
  }
};

export const setUpBareRepositoryFetch = async (path?: string) => {
  const pathCommand = path ? `-C ${path}` : "";
  const fetchOriginCommand = `git ${pathCommand} config remote.origin.fetch "${BARE_REPOSITORY_REMOTE_ORIGIN_FETCH}"`;

  try {
    const command = `git ${pathCommand} config remote.origin.fetch`;
    const { stdout } = await executeCommand(command);

    const remoteOriginFetch = removeNewLine(stdout);

    if (remoteOriginFetch === BARE_REPOSITORY_REMOTE_ORIGIN_FETCH) return;

    await executeCommand(fetchOriginCommand);
    return;
  } catch (e: unknown) {
    try {
      await executeCommand(fetchOriginCommand);
    } catch (e: unknown) {
      if (e instanceof Error) throw e;
    }
  }
};

interface Repo {
  name: string;
  host: string;
  hostDisplayName: string;
  url: string;
  icon: Image;
}

interface Remote {
  url: string;
}

export const parseGitRemotes = async (fullPath: string, path: string = "./.bare/config"): Promise<Repo[]> => {
  const repos: Repo[] = [];

  const gitConfig = await gitConfigParser({ cwd: fullPath, path: path, expandKeys: true });
  if (!gitConfig?.remote) return repos;

  for (const remoteName in gitConfig.remote) {
    const config = gitConfig.remote[remoteName] as Remote;

    const parsed = parseUrl(config.url);

    if (!parsed || !parsed.host || !parsed.pathname) continue;

    const icon = {
      source: {
        light: Icon.Globe as Icon | string,
        dark: Icon.Globe as Icon | string,
      },
    };

    if (parsed.host.includes("github")) {
      icon.source.light = "github-light.png";
      icon.source.dark = "github-dark.png";
    }

    if (parsed.host.includes("gitlab")) {
      icon.source.light = "gitlab-light.png";
      icon.source.dark = "gitlab-dark.png";
    }

    if (parsed.host.includes("bitbucket")) {
      icon.source.light = "bitbucket-light.png";
      icon.source.dark = "bitbucket-dark.png";
    }

    const protocol = "https";
    const url = `${protocol}://${parsed.host}${parsed.pathname.replace(".git", "")}`;

    repos.push({
      name: remoteName,
      host: parsed.host,
      hostDisplayName: parsed.host.split(".")[0].charAt(0).toUpperCase() + parsed.host.split(".")[0].slice(1),
      url: url,
      icon: icon,
    });
  }

  return repos;
};
