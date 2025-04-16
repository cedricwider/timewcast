import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { Entry } from "./types";
import { format } from "date-fns";
import { parseISO } from "date-fns";
import { TimewarriorCli } from "./util/timewarrior-cli";
import { useEffect, useState } from "react";

function getTitle(entry: Entry): string | null {
  if (entry.tags.length === 0) return null;

  const titleLine = entry.tags[0];
  return titleLine.substring(titleLine.indexOf(":") + 2)
}

function getProject(entry: Entry): string | null {
  if (entry.tags.length === 0) return null;

  return entry.tags[0].split(":")[0];
}

function getTags(entry: Entry): Array<string> {
  if (entry.tags.length < 2) return [];

  return entry.tags.slice(1)
}

interface EntryFormProps {
  entry: Entry;
}

interface FormEntry {
  start: string;
  end: string;
  project: string;
  title: string;
  tags: Array<string>
}

export function EntryForm({ entry }: EntryFormProps) {
  const { pop } = useNavigation()
  const [formValues, setFormValues] = useState<FormEntry>({
    start: format(parseISO(entry.start), "HH:mm"),
    end: format(parseISO(entry.end), "HH:mm"),
    project: getProject(entry) ?? "",
    title: getTitle(entry) ?? "",
    tags: getTags(entry)
  });
  const [projects, setProjects] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const availableProjects = TimewarriorCli.getProjects();
    const availableTags = TimewarriorCli.getTags();
    setProjects(availableProjects);
    setTags(availableTags);
  }, []);

  const updateFormValue = (field: keyof FormEntry, value: string | string[]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const save = async (formEntry: FormEntry): Promise<void> => {
    const today = new Date();
    const [startHours, startMinutes] = formEntry.start.split(':').map(Number);
    const [endHours, endMinutes] = formEntry.end.split(':').map(Number);

    const startDate = new Date(today.setHours(startHours, startMinutes, 0));
    const endDate = new Date(today.setHours(endHours, endMinutes, 0));

    TimewarriorCli.untag(entry, entry.tags);
    TimewarriorCli.tag(entry, [`${formEntry.project}: ${formEntry.title}`, ...formEntry.tags]);
    TimewarriorCli.modify("start", entry.id, startDate);
    TimewarriorCli.modify("end", entry.id, endDate);
    await showToast({ style: Toast.Style.Success, title: "Entry saved" });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" onSubmit={save} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="start"
        title="Start"
        value={formValues.start}
        onChange={(value) => updateFormValue("start", value)}
      />
      <Form.TextField
        id="end"
        title="End"
        value={formValues.end}
        onChange={(value) => updateFormValue("end", value)}
      />
      <Form.Dropdown
        id="project"
        title="Project"
        value={formValues.project}
        onChange={(value) => updateFormValue("project", value)}
      >
        {projects.map((project) => (
          <Form.Dropdown.Item key={project} value={project} title={project} />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="title"
        title="Title"
        value={formValues.title}
        onChange={(value) => updateFormValue("title", value)}
      />
      <Form.TagPicker
        id="tags"
        title="Tags"
        value={formValues.tags}
        onChange={(value) => updateFormValue("tags", value)}
      >
        {tags.map((tag) => (
          <Form.TagPicker.Item key={tag} value={tag} title={tag} />
        ))}
      </Form.TagPicker>
    </Form>
  )
}
