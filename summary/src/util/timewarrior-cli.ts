import { execSync } from "child_process";
import { Entry } from "../types";

export class TimewarriorCli {
  public static getEntries(): Array<Entry> {
    const output = execSync("/opt/homebrew/bin/timew export :day").toString();
    return JSON.parse(output);
  }

  public static continue(entryId: number): void {
    const command = `/opt/homebrew/bin/timew continue @${entryId}`;
    execSync(command);
  }
}
