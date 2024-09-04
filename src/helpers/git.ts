import { executeCommand, removeNewLine } from "./general";

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