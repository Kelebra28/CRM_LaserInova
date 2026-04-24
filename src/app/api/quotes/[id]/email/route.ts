import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuotePDF } from "@/lib/pdf";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const quoteId = params.id;
  const { toEmail, message } = await request.json();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      concepts: { orderBy: { order: 'asc' } },
      user: true,
    }
  });

  if (!quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateQuotePDF(quote);
    
    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const defaultMessage = `Hola ${quote.client?.name || "Cliente"},\n\nAdjunto encontrarás la cotización para el proyecto "${quote.project}".\n\nSaludos,\nEl equipo de Laser Inova`;

    const subject = `Cotización ${quote.folio} - Laser Inova`;

    // Send email
    const info = await transporter.sendMail({
      from: `"Laser Inova" <${process.env.SMTP_FROM}>`,
      to: toEmail || quote.client?.email || "",
      subject,
      text: message || defaultMessage,
      attachments: [
        {
          filename: `Cotizacion_${quote.folio}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ]
    });

    // Log the email in DB
    await prisma.emailLog.create({
      data: {
        quoteId: quote.id,
        sentById: (session.user as any).id,
        sentTo: toEmail || quote.client?.email || "Unknown",
        subject,
        body: message || defaultMessage,
        status: "SENT",
        smtpResponse: info.response,
      }
    });

    // Update quote status to SENT
    await prisma.quote.update({
      where: { id: quote.id },
      data: { 
        status: "SENT",
        sentDate: new Date(),
      }
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Log failure
    await prisma.emailLog.create({
      data: {
        quoteId,
        sentById: (session.user as any).id,
        sentTo: toEmail || quote?.client?.email || "Unknown",
        subject: `Cotización ${quote?.folio} - Laser Inova`,
        body: message || "Error al enviar",
        status: "FAILED",
        smtpResponse: error.message || "Unknown error",
      }
    });

    return new NextResponse("Error sending email", { status: 500 });
  }
}
