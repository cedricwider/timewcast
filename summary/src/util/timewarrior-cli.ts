import { execSync } from "child_process";
import { Entry } from "../types";
import { roundToNearestMinutes, format, parseISO } from "date-fns";

export class TimewarriorCli {
  public static getEntries(): Array<Entry> {
    const output = execSync("/opt/homebrew/bin/timew export :day").toString();
    return JSON.parse(output);
  }

  public static continue(entryId: number): void {
    const command = `/opt/homebrew/bin/timew continue @${entryId}`;
    execSync(command);
  }

  public static start(tags: Array<string>, startTime?: string): void {
    const quotedTags = tags.map((tag) => (tag.includes(" ") ? `"${tag}"` : tag));
    const command = `/opt/homebrew/bin/timew start ${startTime ?? ""} ${quotedTags.join(" ")} :adjust`;
    execSync(command);
  }

  public static stop(endTime?: string): void {
    const command = `/opt/homebrew/bin/timew stop ${endTime ?? ""}`.trim();
    execSync(command);
  }

  public static track(startTime: string, endTime: string, tags: Array<string>): void {
    const quotedTags = tags.map((tag) => (tag.includes(" ") ? `"${tag}"` : tag));
    const command = `/opt/homebrew/bin/timew track ${startTime} - ${endTime} ${quotedTags.join(" ")} :adjust`;
    execSync(command);
  }

  public static delete(entryId: number): void {
    const command = `/opt/homebrew/bin/timew delete @${entryId}`;
    execSync(command);
  }

  public static push(): void {
    const command = `/opt/homebrew/bin/timew report moco4timew :day`;
    execSync(command);
  }

  public static ceilStart(entry: Entry): void {
    const startDate = parseISO(entry.start);
    const roundedStartDate = roundToNearestMinutes(startDate, { roundingMethod: "ceil", nearestTo: 15 });
    TimewarriorCli.modify("start", entry.id, roundedStartDate);
  }

  public static ceilEnd(entry: Entry): void {
    const endDate = parseISO(entry.end);
    const roundedEndDate = roundToNearestMinutes(endDate, { roundingMethod: "ceil", nearestTo: 15 });
    TimewarriorCli.modify("end", entry.id, roundedEndDate);
  }

  public static floorStart(entry: Entry): void {
    const startDate = parseISO(entry.start);
    const roundedStartDate = roundToNearestMinutes(startDate, { roundingMethod: "floor", nearestTo: 15 });
    TimewarriorCli.modify("start", entry.id, roundedStartDate);
  }

  public static floorEnd(entry: Entry): void {
    const endDate = parseISO(entry.end);
    const roundedEndDate = roundToNearestMinutes(endDate, { roundingMethod: "floor", nearestTo: 15 });
    TimewarriorCli.modify("end", entry.id, roundedEndDate);
  }

  public static tag(entry: Entry, tags: Array<string>): void {
    const quotedTags = tags.map((tag) => (tag.includes(" ") ? `"${tag}"` : tag));
    const command = `/opt/homebrew/bin/timew tag @${entry.id} ${quotedTags.join(" ")}`;
    execSync(command);
  }

  public static untag(entry: Entry, tags: Array<string>): void {
    const quotedTags = tags.map((tag) => (tag.includes(" ") ? `"${tag}"` : tag));
    const command = `/opt/homebrew/bin/timew untag @${entry.id} ${quotedTags.join(" ")}`;
    execSync(command);
  }

  private static modify(attribute: "start" | "end", id: string, targetDate: Date): void {
    const timeRef = format(targetDate, "HH:mm");
    const command = `/opt/homebrew/bin/timew modify ${attribute} @${id} ${timeRef} :adjust`;
    execSync(command);
  }
}
