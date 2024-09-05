import { useCachedState } from "@raycast/utils";
import { WorktreeGrouped } from "../../helpers/file";
import { Icon, List } from "@raycast/api";
import { relative } from "node:path";
import { preferences } from "../../helpers/raycast";

export function useDirectory() {
  const [directory, setDirectory] = useCachedState<string>("directory", "all");
  return { directory, setDirectory };
}

export function DirectoriesDropdown({ directories }: { directories: WorktreeGrouped[] }) {
  const { directory, setDirectory } = useDirectory();

  return (
    <List.Dropdown tooltip="Select Project Directory" onChange={setDirectory} value={directory}>
      <List.Dropdown.Section>
        <List.Dropdown.Item key="all" title="All" value="all" icon={Icon.HardDrive} />
      </List.Dropdown.Section>
      <List.Dropdown.Section>
        {directories.map((dir: WorktreeGrouped) => {
          return (
            <List.Dropdown.Item
              key={dir.id}
              title={relative(preferences.projectsPath, dir.id)}
              value={dir.id}
              icon={Icon.Folder}
            />
          );
        })}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}
