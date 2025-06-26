import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "HEADTEACHER", "TEACHER", "CLASS_TEACHER", "SECRETARY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: 'desc'
      }
    });
    return NextResponse.json(academicYears);
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return NextResponse.json({ error: "Failed to fetch academic years" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const academicYear = await prisma.academicYear.create({
      data: json,
    });
    return new NextResponse(JSON.stringify(academicYear), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating academic year:", error);
    return NextResponse.json({ error: "Failed to create academic year" }, { status: 500 });
  }
}