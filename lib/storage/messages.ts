import { prisma } from "../utils";

interface SaveMessageParams {
  from: string;
  to: string;
  message: string;
  signature?: string | null;
  isOnchain?: boolean;
  isRead?: boolean;
}

export async function saveMessage({
  from,
  to,
  message,
  signature = null,
  isOnchain = false,
  isRead = false
}: SaveMessageParams) {
  try {
    await prisma.message.create({
      data: {
        from,
        to,
        message,
        signature,
        isOnchain,
        isRead,
        createdAt: new Date()
      }
    });
  } catch (err) {
    console.error("saveMessage error:", err);
    throw err;
  }
}

export async function getMessages(wallet: string) {
  return prisma.message.findMany({
    where: { to: wallet },
    orderBy: { createdAt: "desc" }
  });
}
