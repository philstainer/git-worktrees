import { promisify } from "node:util";
import childProcess, { ExecOptions } from "node:child_process";
import { dirname } from "node:path";

const exec = promisify(childProcess.exec);

export const executeCommand = async (command: string, options?: ExecOptions) => {
  const execOptions: ExecOptions = {
    ...options,
    cwd: options?.cwd,
    // shell: "/opt/homebrew/bin/zsh",
    // shell: "/bin/zsh",
    // timeout: 5 * 1000
  };

  return exec(command, execOptions);
  // return exec(`[ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)" && ${command}`, execOptions);
};

export const batchPromises = async <T, R>(
  items: T[],
  batchSize: number,
  processFn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processFn));

    batchResults.forEach((result) => {
      if (result.status === "rejected") return console.error({ result });

      results.push(result.value);
    });
  }

  return results;
};

/**
 * Removes the first and last characters from a given string.
 *
 * @param {string} string - The string to remove the first and last characters from.
 * @returns {string} The modified string with the first and last characters removed.
 *
 * @example
 * const string = "!Hello, world!";
 * const modifiedString = removeFirstAndLastCharacter(string);
 * console.log(modifiedString); // Output: "Hello, world"
 */
export const removeFirstAndLastCharacter = (string: string): string => string.slice(1, -1);

/**
 * Removes all new line characters from a given string.
 *
 * @param {string} string - The string to remove new line characters from.
 * @returns {string} The modified string with new line characters removed.
 *
 * @example
 * const string = "Hello,\nworld!";
 * const modifiedString = removeNewLine(string);
 * console.log(modifiedString); // Output: "Hello, world!"
 */
export const removeNewLine = (string: string): string => string.replace(/\n/g, "");

/**
 * Traverses up the directory hierarchy from a given path.
 *
 * @param {string} path - The path to traverse up from.
 * @returns {string} The path of the parent directory.
 *
 * @example
 * const path = "/path/to/file.txt";
 * const parentPath = traverseUpDirectory(path);
 * console.log(parentPath); // Output: "/path/to"
 */
export const traverseUpDirectory = (path: string): string => dirname(path);
