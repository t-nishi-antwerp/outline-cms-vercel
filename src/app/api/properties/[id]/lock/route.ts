import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const LOCK_DURATION_MINUTES = 10;

/**
 * Edit Lock API
 * GET: Check lock status
 * POST: Acquire/extend lock
 * DELETE: Release lock
 */

// GET /api/properties/[id]/lock - Check lock status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // Find existing lock
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

    // Check if lock has expired
    const now = new Date();
    if (lock.expiresAt < now) {
      // Delete expired lock
      await prisma.editLock.delete({
        where: { id: lock.id },
      });
      return NextResponse.json({ locked: false });
    }

    // Check if current user owns the lock
    if (lock.userId === session.user.id) {
      return NextResponse.json({
        locked: true,
        ownedByCurrentUser: true,
        expiresAt: lock.expiresAt,
      });
    }

    // Lock is owned by another user
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
      { error: "Failed to check lock status" },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/lock - Acquire or extend lock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing lock
      const existingLock = await tx.editLock.findUnique({
        where: { propertyId },
      });

      // If lock exists
      if (existingLock) {
        // Check if expired
        const now = new Date();
        if (existingLock.expiresAt < now) {
          // Delete expired lock and create new one
          await tx.editLock.delete({
            where: { id: existingLock.id },
          });
        } else if (existingLock.userId !== session.user.id) {
          // Lock is held by another user
          const lockOwner = await tx.user.findUnique({
            where: { id: existingLock.userId },
            select: { name: true, email: true },
          });

          throw new Error(
            `This property is being edited by ${lockOwner?.name}. Lock expires at ${existingLock.expiresAt.toLocaleString("ja-JP")}`
          );
        }
      }

      // Create or update lock
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
      message: "Lock acquired successfully",
    });
  } catch (error) {
    console.error("Lock acquisition error:", error);

    if (error instanceof Error && error.message.includes("being edited")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { error: "Failed to acquire lock" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id]/lock - Release lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: propertyId } = await params;

    // Delete only locks owned by current user
    const deleted = await prisma.editLock.deleteMany({
      where: {
        propertyId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "No lock found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lock released successfully",
    });
  } catch (error) {
    console.error("Lock release error:", error);
    return NextResponse.json(
      { error: "Failed to release lock" },
      { status: 500 }
    );
  }
}
