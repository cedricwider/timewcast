import { Icon, List } from "@raycast/api";

export interface Entry {
  id?: string;
  start: string;
  end?: string;
  tags: Array<string>;
}

export interface TimeWarriorEntry {
  id: number;
  title: string;
  icon: Icon;
  subtitle: string;
  accessory: List.Item.Accessory;
  entry: Entry;
}
