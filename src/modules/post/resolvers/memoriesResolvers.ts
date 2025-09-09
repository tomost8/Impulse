import prisma from "../../../config/prisma";
import { startOfMonth, addMonths, startOfDay, addDays } from "date-fns";
import { Prisma } from "@prisma/client";

/**
 * Compute UTC month bounds: [start, end)
 * month is 1..12
 */
const monthBounds = (year: number, month1to12: number) => {
  const start = startOfMonth(new Date(Date.UTC(year, month1to12 - 1, 1)));
  const end = addMonths(start, 1);
  return { start, end };
};

/**
 * Compute UTC day bounds: [start, end)
 */
const dayBounds = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  const start = startOfDay(d);
  const end = addDays(start, 1);
  return { start, end };
};

/**
 * Utility: encode cursor
 */
const encodeCursor = (date: Date, id: number) => `${date.getTime()}_${id}`;

export const memoriesResolvers = {
  Query: {
    // Posts of a month, reverse chronological; supports category and activityIds filters; cursor pagination
    postsByMonth: async (_: any, { input }: any, ctx: any) => {
      const userId: number | undefined = input.userId ?? ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const { start, end } = monthBounds(input.year, input.month);
      const take: number = Math.min(input.first ?? 36, 100);

      // Base where matching your schema
      const whereBase: Prisma.PostWhereInput = {
        author_id: userId,
        is_deleted: false,
        created_at: { gte: start, lt: end },
        ...(input.categories?.length ? { category: { in: input.categories } } : {}),
        ...(input.activityIds?.length ? { activity: { id: { in: input.activityIds } } } : {}),
      };

      // Cursor handling (created_at, id)
      let where: Prisma.PostWhereInput = { ...whereBase };
      if (input.after) {
        const [tsStr, idStr] = input.after.split("_");
        const ts = new Date(Number(tsStr));
        const id = Number(idStr);
        where = {
          AND: [
            whereBase,
            {
              OR: [
                { created_at: { lt: ts } },
                { AND: [{ created_at: ts }, { id: { lt: id } }] },
              ],
            },
          ],
        };
      }

      const [items, totalInMonth] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: [{ created_at: "desc" }, { id: "desc" }],
          take,
          include: { activity: true },
        }),
        prisma.post.count({
          where: {
            author_id: userId,
            is_deleted: false,
            created_at: { gte: start, lt: end },
            ...(input.categories?.length ? { category: { in: input.categories } } : {}),
            ...(input.activityIds?.length ? { activity: { id: { in: input.activityIds } } } : {}),
          },
        }),
      ]);

      const endCursor = items.length
        ? encodeCursor(items[items.length - 1].created_at, items[items.length - 1].id)
        : null;

      return {
        edges: items.map((p) => ({
          cursor: encodeCursor(p.created_at, p.id),
          node: p,
        })),
        pageInfo: { hasNextPage: items.length === take, endCursor },
        totalInMonth,
      };
    },

    // Calendar for the month: first post per day (chronological) + count
    calendarMonth: async (_: any, { input }: any, ctx: any) => {
      const userId: number | undefined = input.userId ?? ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const { start, end } = monthBounds(input.year, input.month);

      // Fetch all posts for the month filtered, ordered chronological
      const posts = await prisma.post.findMany({
        where: {
          author_id: userId,
          is_deleted: false,
          created_at: { gte: start, lt: end },
          ...(input.categories?.length ? { category: { in: input.categories } } : {}),
          ...(input.activityIds?.length ? { activity: { id: { in: input.activityIds } } } : {}),
        },
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        include: { activity: true },
      });

      // Group by day (UTC)
      const byDay = new Map<
        string,
        { date: Date; firstPost: any | null; count: number }
      >();

      for (const p of posts) {
        const dayKey = startOfDay(p.created_at).toISOString();
        if (!byDay.has(dayKey)) {
          byDay.set(dayKey, { date: startOfDay(p.created_at), firstPost: p, count: 1 });
        } else {
          const v = byDay.get(dayKey)!;
          v.count += 1;
        }
      }

      // Build full month days array in chronological order
      const result: { date: string; totalPosts: number; previewPost: any | null }[] = [];
      for (
        let d = new Date(start);
        d < end;
        d = addDays(d, 1)
      ) {
        const key = startOfDay(d).toISOString();
        const entry = byDay.get(key);
        result.push({
          date: new Date(d).toISOString().slice(0, 10), // YYYY-MM-DD
          totalPosts: entry?.count ?? 0,
          previewPost: entry?.firstPost ?? null,
        });
      }

      return result;
    },

    // Day "story" posts (chronological)
    dayPosts: async (_: any, { input }: any, ctx: any) => {
      const userId: number | undefined = input.userId ?? ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const { start, end } = dayBounds(input.date);

      const where: Prisma.PostWhereInput = {
        author_id: userId,
        is_deleted: false,
        created_at: { gte: start, lt: end },
        ...(input.categories?.length ? { category: { in: input.categories } } : {}),
        ...(input.activityIds?.length ? { activity: { id: { in: input.activityIds } } } : {}),
      };

      return prisma.post.findMany({
        where,
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        include: { activity: true },
      });
    },

    // Previous/next POST (not date) within the same month/filter
    neighborPost: async (_: any, { input }: any, ctx: any) => {
      const userId: number | undefined = input.userId ?? ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const { start, end } = monthBounds(input.year, input.month);

      const filterBase: Prisma.PostWhereInput = {
        author_id: userId,
        is_deleted: false,
        created_at: { gte: start, lt: end },
        ...(input.categories?.length ? { category: { in: input.categories } } : {}),
        ...(input.activityIds?.length ? { activity: { id: { in: input.activityIds } } } : {}),
      };

      const current = await prisma.post.findUnique({
        where: { id: Number(input.currentPostId) },
        select: { id: true, created_at: true },
      });
      if (!current) return { prevId: null, nextId: null };

      // Next (older in desc ordering): created_at < current.created_at OR (== and id < current.id)
      const next = await prisma.post.findFirst({
        where: {
          AND: [
            filterBase,
            {
              OR: [
                { created_at: { lt: current.created_at } },
                { AND: [{ created_at: current.created_at }, { id: { lt: current.id } }] },
              ],
            },
          ],
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        select: { id: true },
      });

      // Prev (newer in desc ordering): created_at > current.created_at OR (== and id > current.id)
      const prev = await prisma.post.findFirst({
        where: {
          AND: [
            filterBase,
            {
              OR: [
                { created_at: { gt: current.created_at } },
                { AND: [{ created_at: current.created_at }, { id: { gt: current.id } }] },
              ],
            },
          ],
        },
        orderBy: [{ created_at: "asc" }, { id: "asc" }], // find newer one
        select: { id: true },
      });

      return { prevId: prev?.id ?? null, nextId: next?.id ?? null };
    },
  },
};