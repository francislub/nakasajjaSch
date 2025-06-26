import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "HEADTEACHER", "TEACHER", "CLASS_TEACHER", "SECRETARY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const terms = await prisma.term.findMany();
    return NextResponse.json(terms, { status: 200 });
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, startDate, endDate } = await req.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    console.error("Error creating term:", error);
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
  }
}