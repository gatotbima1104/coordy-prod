export function uuidToSlug(uuid: string): string {
  const firstThree = uuid.replace(/-/g, "").slice(0, 6).toLowerCase();
  const map: Record<string, string> = {
    "0": "j",
    "1": "a",
    "2": "b",
    "3": "c",
    "4": "d",
    "5": "e",
    "6": "f",
    "7": "g",
    "8": "h",
    "9": "i",
  };
  return firstThree
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}
