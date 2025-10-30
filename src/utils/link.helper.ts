import { prisma } from "../configs/config";

export const formatToSlug = (text?: string): string => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

export const shortSlug = (input: string, maxLen: number = 3): string => {
  if (!input) return "";

  const clean = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const initials = words.map((w) => w[0]).join("");
    return initials.slice(0, maxLen);
  }
  return words[0].slice(0, maxLen);
};


export const shortEventSlug = (title: string): string => shortSlug(title, 3);

export const shortParticipantSlug = (name: string): string =>
  shortSlug(name, name.length <= 3 ? 2 : 3);

export const findEventByShortSlug = async (shortSlug: string) => {
  const event = await prisma.event.findFirst({
    where: { slug: { startsWith: shortSlug } },
    include: { participants: true },
  });
  return event;
};

export const findParticipantByShortSlug = (event: any, shortSlug: string) => {
  if (!event?.participants) return null;

  return event.participants.find((p: any) => {
    const link = p.link.trim().toLowerCase();
    const slug = shortSlug.toLowerCase();
    return link.endsWith(`/${slug}`) || link.endsWith(`=${slug}`);
  });
};

