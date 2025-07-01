import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.subjectTeacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Subject teacher assignment deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject teacher assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
