// app/api/enrollments/[id]/pause/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Enrollment from "@/models/Enrollment";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const enrollment = await Enrollment.findByIdAndUpdate(
      params.id,
      {
        status: "paused",
        pausedAt: new Date(),
        pausedBy: "tutor",
      },
      { new: true }
    );

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error pausing enrollment:", error);
    return NextResponse.json(
      { error: "Failed to pause enrollment" },
      { status: 500 }
    );
  }
}