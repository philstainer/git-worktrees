import { Detail } from "@raycast/api";

export default function Command({ directory }: { directory?: string }) {
  return <Detail markdown={`Add worktree ${directory}`} />;
}
