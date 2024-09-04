import { promisify } from "node:util";
import childProcess, { ExecOptions } from "node:child_process";
import { dirname } from "node:path";

const exec = promisify(childProcess.exec);

/**
 * Executes a command in the current working directory.
 *
 * @param {string} command - The command to execute.
 * @param {ExecOptions} [options] - Optional options for the command execution.
 * @returns {Promise<string>} A promise that resolves to the output of the command.
 *
 * @example
 * const command = "echo 'Hello, world!'";
 * const output = await executeCommand(command);
 * console.log(output); // Output: "Hello, world!"
 */
export const executeCommand = async (command: string, options?: ExecOptions) => {
  const execOptions: ExecOptions = {
    ...options,
    cwd: options?.cwd,
    // shell: "/opt/homebrew/bin/zsh",
    // timeout: 5 * 1000
  };

  return exec(command, execOptions);
  // return exec(`[ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)" && ${command}`, execOptions);
};

/**
 * Processes items in batches using the provided asynchronous processing function.
 *
 * @template T - The type of items in the input array.
 * @template R - The type of items in the output array.
 * @param {T[]} items - The array of items to be processed.
 * @param {number} batchSize - The number of items to process in each batch.
 * @param {(item: T) => Promise<R>} processFn - The asynchronous function to process each item.
 * @returns {Promise<R[]>} A promise that resolves to an array of processed items.
 *
 * @example
 * async function example() {
 *   const items = [1, 2, 3, 4, 5, 6];
 *   const batchSize = 2;
 *   const processFn = async (num) => num * 2;
 *
 *   try {
 *     const results = await batchPromises(items, batchSize, processFn);
 *     console.log(results); // Output: [2, 4, 6, 8, 10, 12]
 *   } catch (error) {
 *     console.error(error);
 *   }
 * }
 *
 * example();
 */
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
