import { ActionPanel, Action, Icon, List, closeMainWindow, showHUD, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { TimewarriorCli } from "./util/timewarrior-cli";
import { format, formatISO, parseISO } from "date-fns";
import { Entry, TimeWarriorEntry } from "./types";
import { EntryForm } from "./entry-form";

function getTimeWarriorSummary(): TimeWarriorEntry[] {
  try {
    const entries = TimewarriorCli.getEntries();
    return entries.map(entry => parseEntry(entry))
  } catch (error) {
    console.error('Error fetching TimeWarrior summary:', error);
    return [];
  }
}

function isQuarterHour(date: Date): boolean {
  const minutes = date.getMinutes();
  return minutes === 0 || minutes === 15 || minutes === 30 || minutes === 45;
}

function parseEntry(entry: Entry): TimeWarriorEntry {
  const startDate = parseISO(entry.start)
  const endDate = entry.end ? parseISO(entry.end) : null
  const accessory: List.Item.Accessory = {
    icon: Icon.Clock,
    text: `${format(startDate, 'HH:mm:ss')} - ${endDate ? format(endDate, 'HH:mm:ss') : '...'}`
  }

  let icon = Icon.CircleProgress; // Default for ongoing tracking

  if (endDate) {
    const startOnQuarter = isQuarterHour(startDate);
    const endOnQuarter = isQuarterHour(endDate);

    if (startOnQuarter && endOnQuarter) {
      icon = Icon.CircleProgress100;
    } else if (startOnQuarter || endOnQuarter) {
      icon = Icon.CircleProgress75;
    } else {
      icon = Icon.CircleProgress25;
    }
  }

  return {
    id: Number(entry.id),
    title: entry.tags[0] || "N/A",
    subtitle: entry.tags.slice(1).join(", "),
    accessory,
    icon,
    entry
  }
}

export default function Command() {
  const [items, setItems] = useState<TimeWarriorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = () => {
    setIsLoading(true);
    try {
      const entries = getTimeWarriorSummary().sort((a: TimeWarriorEntry, b: TimeWarriorEntry) => a.id - b.id);
      setItems(entries);
    } finally {
      setIsLoading(false);
    }
  };

  const onContinue = (entry: TimeWarriorEntry): void => {
    TimewarriorCli.continue(entry.id);
    closeMainWindow({ clearRootSearch: true })
    showHUD("Continuing " + entry.title);
    loadItems();
  }

  const onStop = async (entry: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.stop();
    await showToast({ style: Toast.Style.Success, title: `${entry.title} Stopped` });
    loadItems();
  }

  const onDelete = async (entry: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.delete(entry.id);
    await showToast({ style: Toast.Style.Success, title: `${entry.title} deleted` })
    loadItems();
  }

  const onPush = () => {
    TimewarriorCli.push();
    closeMainWindow({ clearRootSearch: true })
    showHUD("Entries Submitted");
  }

  const onFloorStart = async (item: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.floorStart(item.entry);
    await showToast({ style: Toast.Style.Success, title: `${item.title} floored` })
    loadItems();
  }

  const onFloorEnd = async (item: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.floorEnd(item.entry);
    await showToast({ style: Toast.Style.Success, title: `${item.title} floored` })
    loadItems();
  }

  const onCeilStart = async (item: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.ceilStart(item.entry);
    await showToast({ style: Toast.Style.Success, title: `${item.title} ceiled` })
    loadItems();
  }

  const onCeilEnd = async (item: TimeWarriorEntry): Promise<void> => {
    TimewarriorCli.ceilEnd(item.entry);
    await showToast({ style: Toast.Style.Success, title: `${item.title} ceiled` })
    loadItems();
  }

  const newEntry = (endDate: Date | null = null): Entry => {
    const entry: Entry = { start: formatISO(new Date()), tags: [] }
    if (endDate) entry.end = formatISO(endDate)

    return entry
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <List
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.ArrowClockwise}
            title="Reload"
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={loadItems}
          />
        </ActionPanel>
      }
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[item.accessory]}
          actions={
            <ActionPanel>
              {item.entry.end ? (
                <Action icon={Icon.Repeat} title="Continue" onAction={() => { onContinue(item) }} />
              ) : (
                <Action icon={Icon.Stop} title="Stop" onAction={() => { onStop(item) }} />
              )}
              <Action.Push icon={Icon.Pencil} title="Edit" target={<EntryForm entry={item.entry} />} onPop={loadItems} />
              <Action.Push icon={Icon.Play} title="Start New" target={<EntryForm entry={newEntry()} />} shortcut={{ modifiers: ["cmd"], key: "n" }} onPop={loadItems} />
              <Action.Push icon={Icon.PlusSquare} title="Track New" target={<EntryForm entry={newEntry(new Date())} />} shortcut={{ modifiers: ["cmd"], key: "t" }} onPop={loadItems} />
              <Action icon={Icon.Upload} title="Push" shortcut={{ modifiers: ["cmd"], key: "u" }} onAction={onPush} />
              <Action icon={Icon.Trash} title="Delete" shortcut={{ modifiers: ["cmd"], key: "x" }} onAction={() => { onDelete(item) }} />
              <Action icon={Icon.Forward} title="Ceil Start" shortcut={{ modifiers: ["cmd"], key: "s" }} onAction={() => { onCeilStart(item) }} />
              <Action icon={Icon.Rewind} title="Floor Start" shortcut={{ modifiers: ["cmd", "shift"], key: "s" }} onAction={() => { onFloorStart(item) }} />
              <Action icon={Icon.Forward} title="Ceil End" shortcut={{ modifiers: ["cmd"], key: "e" }} onAction={() => { onCeilEnd(item) }} />
              <Action icon={Icon.Rewind} title="Floor End" shortcut={{ modifiers: ["cmd", "shift"], key: "e" }} onAction={() => { onFloorEnd(item) }} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
