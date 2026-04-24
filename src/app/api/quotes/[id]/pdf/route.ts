import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuotePDF } from "@/lib/pdf";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const quoteId = params.id;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      concepts: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  try {
    const pdfBuffer = await generateQuotePDF(quote);
    
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Cotizacion_${quote.folio}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
