Lets create a temp folder when cloning the worktree and then move later once successful!

import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const createTempFolder = async () => {
  console.log(tmpdir());

  try {
    const x = await mkdtemp(join(tmpdir(), "worktree-"));
    console.log({ x });

    const a = await rm(x, { recursive: true });
    console.log({ a });

    const b = await rm(x, { recursive: true, force: true });
    console.log({ b });
  } catch (err) {
    console.error(err);
  }
};

createTempFolder();
