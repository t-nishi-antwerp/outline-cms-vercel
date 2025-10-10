import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const LOCK_DURATION_MINUTES = 10; // Ì√Øn	πP	

/**
 * Ë∆Ì√Øn÷ó˚Ù∞
 * GET: Ì√Ø∂Kn∫ç
 * POST: Ì√Øn÷ó˚ˆw
 * DELETE: Ì√Øn„d
 */

// GET /api/properties/[id]/lock - Ì√Ø∂Kí∫ç
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // ˛(nÌ√Øí∫ç
    const lock = await prisma.editLock.findUnique({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lock) {
      return NextResponse.json({ locked: false });
    }

    // Ì√Øn	πPí∫ç
    const now = new Date();
    if (lock.expiresAt < now) {
      // PånÌ√ØíJd
      await prisma.editLock.delete({
        where: { id: lock.id },
      });
      return NextResponse.json({ locked: false });
    }

    // ÍLÌ√ØWfDã4
    if (lock.userId === session.user.id) {
      return NextResponse.json({
        locked: true,
        ownedByCurrentUser: true,
        expiresAt: lock.expiresAt,
      });
    }

    // ÷nÊ¸∂¸LÌ√ØWfDã4
    return NextResponse.json({
      locked: true,
      ownedByCurrentUser: false,
      lockedBy: {
        name: lock.user.name,
        email: lock.user.email,
      },
      expiresAt: lock.expiresAt,
    });
  } catch (error) {
    console.error("Lock check error:", error);
    return NextResponse.json(
      { error: "Ì√Ø∂Kn∫çk1WW~W_" },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/lock - Ì√Øí÷ó˚ˆw
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    // »ÈÛ∂Ø∑ÁÛÖgÊ
    const result = await prisma.$transaction(async (tx) => {
      // ‚XnÌ√Øí∫ç
      const existingLock = await tx.editLock.findUnique({
        where: { propertyId },
      });

      // Ì√ØLX(Yã4
      if (existingLock) {
        // På¡ß√Ø
        const now = new Date();
        if (existingLock.expiresAt < now) {
          // PåjngJdWf∞è\
          await tx.editLock.delete({
            where: { id: existingLock.id },
          });
        } else if (existingLock.userId !== session.user.id) {
          // ÷nÊ¸∂¸LÌ√Ø-
          const lockOwner = await tx.user.findUnique({
            where: { id: existingLock.userId },
            select: { name: true, email: true },
          });

          throw new Error(
            `Sniˆo${lockOwner?.name}UìLË∆-gY${existingLock.expiresAt.toLocaleString("ja-JP")}~g	`
          );
        }
      }

      // Ì√Øí\~_oÙ∞
      const lock = await tx.editLock.upsert({
        where: { propertyId },
        create: {
          propertyId,
          userId: session.user.id,
          expiresAt,
        },
        update: {
          expiresAt,
        },
      });

      return lock;
    });

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      message: "Ë∆Ì√Øí÷óW~W_",
    });
  } catch (error) {
    console.error("Lock acquisition error:", error);

    if (error instanceof Error && error.message.includes("LË∆-gY")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { error: "Ì√Øn÷ók1WW~W_" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id]/lock - Ì√Øí„d
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // ÍnÌ√ØnJdÔ˝
    const deleted = await prisma.editLock.deleteMany({
      where: {
        propertyId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "JdYãÌ√ØLãdKä~[ì" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ë∆Ì√Øí„dW~W_",
    });
  } catch (error) {
    console.error("Lock release error:", error);
    return NextResponse.json(
      { error: "Ì√Øn„dk1WW~W_" },
      { status: 500 }
    );
  }
}
