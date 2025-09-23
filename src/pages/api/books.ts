// src/pages/api/books.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { search, subject } = req.query;

      const books = await prisma.book.findMany({
        where: {
          AND: [
            { stock: { gt: 0 } },
            search
              ? {
                  OR: [
                    { title: { contains: search as string } },
                    { author: { contains: search as string } },
                    { isbn: { contains: search as string } },
                  ],
                }
              : {},
          ],
        },
      });

      return res.status(200).json(books);
    }

    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("❌ API Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
}
