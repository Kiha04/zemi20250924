import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../utils/database";
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  console.log("API /api/donate received body:", req.body);
  const { isbn, title, author, thumbnail } = req.body;

  let errors: string[] = [];
  if (!title) {
    errors.push("タイトルは必須です。");
  }
  if (!author) {
    console.warn("API /api/donate: Author is missing, proceeding anyway...");
  }
  if (!isbn) {
    errors.push("ISBNは必須です。");
  }

  if (errors.length > 0) {
    console.error("API /api/donate validation errors:", errors);
    return res.status(400).json({ error: "入力内容が正しくありません。", details: errors });
  }

  try {
    const existingBook = await prisma.book.findUnique({ where: { isbn } });

    let resultBook;
    if (existingBook) {
      console.log(`API /api/donate: Updating stock for ISBN: ${isbn}`);
      resultBook = await prisma.book.update({
        where: { isbn },
        data: {
          stock: { increment: 1 },
          ...(thumbnail && { thumbnail }),
        },
      });
      console.log(`API /api/donate: Stock updated for Book ID: ${resultBook.id}`);
    } else {
      console.log(`API /api/donate: Creating new book for ISBN: ${isbn}`);
      resultBook = await prisma.book.create({
        data: {
          isbn,
          title,
          author: author || "著者不明",
          thumbnail: thumbnail || null,
          stock: 1,
        },
      });
      console.log(`API /api/donate: New book created with ID: ${resultBook.id}`);
    }

    return res.status(200).json({ message: "本の登録処理を受け付けました。", book: resultBook });
  } catch (error: any) {
    console.error("❌ API /api/donate Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'ユニーク制約違反が発生しました。登録情報が正しいかどうかをもう一度ご確認の上、お手数ですが最初からやり直してください。',
          details: error.meta,
        });
      }
    }

    return res.status(500).json({
      error: "サーバー内部でエラーが発生しました。登録情報が正しいかどうかをもう一度ご確認の上、お手数ですが最初からやり直してください。",
      message: error.message,
    });
  }
}
