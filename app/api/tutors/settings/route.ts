// app/api/tutor/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Tutor from "@/models/Tutor";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { firstName, lastName, phone, bio } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !bio) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fix: Use returnDocument: 'after' instead of deprecated new: true
    const tutor = await Tutor.findOneAndUpdate(
      { email: session.user.email },
      { 
        firstName, 
        lastName, 
        phone, 
        bio,
        updatedAt: new Date()
      },
      { 
        returnDocument: 'after', // This replaces { new: true }
        runValidators: true // Ensures model validations are run
      }
    );

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        phone: tutor.phone,
        bio: tutor.bio,
      }
    });
  } catch (error) {
    console.error("Error updating tutor settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings. Please try again." },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to fetch settings if needed
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const tutor = await Tutor.findOne({ email: session.user.email }).select('-__v');

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      email: tutor.email,
      phone: tutor.phone,
      bio: tutor.bio,
      qualifications: tutor.qualifications || [],
    });
  } catch (error) {
    console.error("Error fetching tutor settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}