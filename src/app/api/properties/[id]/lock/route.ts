import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const LOCK_DURATION_MINUTES = 10; // �ïn	�P	

/**
 * ���ïn֗���
 * GET: �ï�Kn��
 * POST: �ïn֗��w
 * DELETE: �ïn�d
 */

// GET /api/properties/[id]/lock - �ï�K���
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // �(n�ï���
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

    // �ïn	�P���
    const now = new Date();
    if (lock.expiresAt < now) {
      // P�n�ï�Jd
      await prisma.editLock.delete({
        where: { id: lock.id },
      });
      return NextResponse.json({ locked: false });
    }

    // �L�ïWfD�4
    if (lock.userId === session.user.id) {
      return NextResponse.json({
        locked: true,
        ownedByCurrentUser: true,
        expiresAt: lock.expiresAt,
      });
    }

    // �n����L�ïWfD�4
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
      { error: "�ï�Kn��k1WW~W_" },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/lock - �ï�֗��w
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    // ��󶯷��g�
    const result = await prisma.$transaction(async (tx) => {
      // �Xn�ï���
      const existingLock = await tx.editLock.findUnique({
        where: { propertyId },
      });

      // �ïLX(Y�4
      if (existingLock) {
        // P���ï
        const now = new Date();
        if (existingLock.expiresAt < now) {
          // P�jngJdWf��\
          await tx.editLock.delete({
            where: { id: existingLock.id },
          });
        } else if (existingLock.userId !== session.user.id) {
          // �n����L�ï-
          const lockOwner = await tx.user.findUnique({
            where: { id: existingLock.userId },
            select: { name: true, email: true },
          });

          throw new Error(
            `Sni�o${lockOwner?.name}U�L��-gY${existingLock.expiresAt.toLocaleString("ja-JP")}~g	`
          );
        }
      }

      // �ï�\~_o��
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
      message: "���ï�֗W~W_",
    });
  } catch (error) {
    console.error("Lock acquisition error:", error);

    if (error instanceof Error && error.message.includes("L��-gY")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { error: "�ïn֗k1WW~W_" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id]/lock - �ï��d
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // �n�ïnJd��
    const deleted = await prisma.editLock.deleteMany({
      where: {
        propertyId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "JdY��ïL�dK�~[�" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "���ï��dW~W_",
    });
  } catch (error) {
    console.error("Lock release error:", error);
    return NextResponse.json(
      { error: "�ïn�dk1WW~W_" },
      { status: 500 }
    );
  }
}
