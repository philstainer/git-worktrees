import { List } from "./List";
import { Item } from "./Item";

import type { Worktree as TWorktree } from "#/config/types";

export const Worktree = {
  List: List,
  Item: Item,
};

export type Worktree = TWorktree;
