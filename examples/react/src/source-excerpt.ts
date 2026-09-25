// Select checked-in source by unique lines so documentation fails visibly if the example changes.
export function sourceExcerpt(source: string, firstLine: string, nextLine: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const matches = (needle: string) => lines.flatMap((line, index) => line.trim() === needle.trim() ? [index] : []);
  const starts = matches(firstLine);
  const ends = matches(nextLine);
  const start = starts[0];
  const end = ends[0];
  if (starts.length !== 1 || ends.length !== 1 || start === undefined || end === undefined || start >= end) {
    throw new Error(`Cannot find a unique source excerpt between ${firstLine} and ${nextLine}`);
  }
  const excerpt = lines.slice(start, end);
  const nonempty = excerpt.filter((line) => line.trim());
  if (nonempty.length === 0) throw new Error(`Empty source excerpt after ${firstLine}`);
  const indentation = Math.min(...nonempty.map((line) => line.match(/^\s*/)?.[0].length ?? 0));
  return excerpt.map((line) => line.slice(indentation)).join("\n").trimEnd();
}
