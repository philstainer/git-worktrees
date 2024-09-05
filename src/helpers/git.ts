import { executeCommand, removeNewLine } from "./general";
import { BARE_REPOSITORY_REMOTE_ORIGIN_FETCH } from "../config/constants";

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
