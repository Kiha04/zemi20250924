import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "本のIDが必要です" });
    }

    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      return res.status(404).json({ error: "本が見つかりません" });
    }

    if (book.stock <= 0) {
      return res.status(400).json({ error: "在庫がありません" });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: { stock: { decrement: 1 } },
    });

    return res.status(200).json({ message: "本を受け取りました", book: updatedBook });
  } catch (error) {
    console.error("❌ API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
