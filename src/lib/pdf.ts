import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function generateQuotePDF(quote: any): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header: Logo and Title
  try {
    const logoPath = path.join(process.cwd(), "public", "logo_pdf.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    // Coordinates and size: x, y, width, height. Maintaining rough aspect ratio
    doc.addImage(logoBase64, "PNG", 14, 10, 50, 15);
  } catch (error) {
    console.error("No se pudo cargar el logo para el PDF", error);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text("LASER INOVA", 14, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("COTIZACIÓN", pageWidth / 2, 22, { align: "center" });

  // Horizontal Line
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);

  // Top Right Details (Fecha & Folio)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const formattedDate = new Date(quote.createdAt).toLocaleDateString("es-MX");
  doc.text(`Fecha:   ${formattedDate}`, pageWidth - 14, 36, { align: "right" });
  doc.text(`ID Proyecto:   ${quote.folio}`, pageWidth - 14, 42, { align: "right" });

  // Top Left Details (Client & Project)
  let currentY = 40;
  if (quote.client) {
    doc.setFont("helvetica", "normal");
    doc.text("CLIENTE:", 14, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(quote.client.name, 35, currentY);
    currentY += 6;
    if (quote.client.company) {
      doc.setFont("helvetica", "normal");
      doc.text(quote.client.company, 35, currentY);
      currentY += 6;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.text("Proyecto:", 14, currentY);
  doc.text(quote.project || "", 35, currentY);
  currentY += 12;

  // Description (General)
  let tableStartY = currentY;
  if (quote.description) {
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(quote.description, pageWidth - 28);
    doc.text(splitDesc, 14, currentY);
    tableStartY = currentY + (splitDesc.length * 5) + 5;
  }

  // Concepts Table
  const tableColumn = ["Descripción", "Cant", "Detalles", "Importe\nUnitario", "Importe"];
  const tableRows: any[][] = [];

  quote.concepts.forEach((concept: any) => {
    // Construct the details string based on the concept type and available data
    let detalles = concept.details || "";
    if (!detalles) {
      const parts = [];
      if (concept.conceptType === "CORTE" || concept.conceptType === "GRABADO") {
        parts.push(`Servicio de ${concept.conceptType.toLowerCase()}`);
        if (concept.material) parts.push(`en ${concept.material.name}`);
        if (concept.width && concept.height) parts.push(`Medidas: ${concept.width}x${concept.height}cm`);
        if (concept.clientProvidesMaterial) parts.push(`(Material proporcionado por el cliente)`);
      }
      detalles = parts.join(". ") + (parts.length > 0 ? "." : "");
    }

    tableRows.push([
      concept.description,
      concept.quantity.toString(),
      detalles,
      `$${concept.finalUnitPrice.toFixed(2)}`,
      `$${concept.totalAmount.toFixed(2)}`,
    ]);
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: tableRows,
    theme: 'plain',
    headStyles: { 
      fillColor: [102, 102, 102], // Dark gray like the image #666
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle'
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 9,
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Descripción
      1: { cellWidth: 15, halign: 'center' }, // Cant
      2: { cellWidth: 'auto' }, // Detalles (takes remaining space)
      3: { cellWidth: 25, halign: 'right' }, // Importe Unitario
      4: { cellWidth: 25, halign: 'right' }, // Importe
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] // Light gray background for alternate rows
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;

  // Totals Section (Right aligned)
  const totalsY = finalY + 10;
  doc.setFontSize(11);
  
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", pageWidth - 45, totalsY, { align: "right" });
  doc.text(`$${quote.subtotal.toFixed(2)}`, pageWidth - 14, totalsY, { align: "right" });

  doc.text("IVA:", pageWidth - 45, totalsY + 8, { align: "right" });
  doc.text(`$${quote.tax.toFixed(2)}`, pageWidth - 14, totalsY + 8, { align: "right" });

  doc.setFontSize(13);
  doc.text(`$${quote.total.toFixed(2)}`, pageWidth - 14, totalsY + 20, { align: "right" });
  // We can't easily bold just the "Total" label differently than the amount, but we'll leave it as is.
  // Actually, let's just not print "Total:" since the image doesn't have it, just the bold number. Wait, the image doesn't have the word "Total:"? Ah, the image cuts off or just shows the bold number. Let's add it for clarity if it's missing, or omit it. The image shows Subtotal, IVA, and then just a very bold number at the bottom.

  // Footer / Consideraciones
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  
  const considerationsText = quote.visibleConsiderations 
    ? ["- Consideraciones:", ...quote.visibleConsiderations.split("\n")]
    : [
        "- Consideraciones:",
        "- Tiempo de entrega: de 1 a 3 días hábiles.",
        "- 50% anticipo, 50% al programar envío o entrega.",
        "- El costo puede variar si hay cambios en medidas o diseño.",
        "- Vigencia de cotización 20 días."
      ];

  // Calculate footer position (bottom of page or below table, whichever is lower)
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.max(totalsY + 40, pageHeight - 40);
  
  doc.text(considerationsText, 14, footerY - 15);

  // Footer Line and Contact Info
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFont("helvetica", "bold");
  doc.text("www.laserinova.com", 14, footerY + 6);
  doc.text("info@laserinova.com", pageWidth - 14, footerY + 6, { align: "right" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer;
}

export async function generateMonthlyReportPDF(quotes: any[], month: number, year: number): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  // Header
  try {
    const logoPath = path.join(process.cwd(), "public", "logo_pdf.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    doc.addImage(logoBase64, "PNG", 14, 10, 40, 12);
  } catch (error) {
    doc.setFontSize(18);
    doc.text("LASER INOVA", 14, 20);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`REPORTE MENSUAL: ${monthNames[month - 1].toUpperCase()} ${year}`, pageWidth / 2, 25, { align: "center" });

  doc.setDrawColor(200);
  doc.line(14, 30, pageWidth - 14, 30);

  // Stats Summary
  const activeQuotes = quotes.filter(q => q.status !== "CANCELLED" && q.status !== "REJECTED");
  const totalAmount = activeQuotes.reduce((sum, q) => sum + q.total, 0);
  const totalCollected = quotes.reduce((sum, q) => sum + (q.realAmountCollected || 0), 0);
  const totalUtility = activeQuotes.reduce((sum, q) => sum + (q.realUtilityTotal || 0), 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Cotizaciones: ${quotes.length}`, 14, 40);
  doc.text(`Total Cotizado: $${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14, 46);
  doc.text(`Cobrado Real: $${totalCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 80, 40);
  doc.text(`Utilidad Estimada Total: $${totalUtility.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 80, 46);

  // Table
  const tableColumn = ["Folio", "Fecha", "Cliente", "Estatus", "Total", "Utilidad"];
  const tableRows = quotes.map(q => [
    q.folio,
    new Date(q.createdAt).toLocaleDateString("es-MX"),
    q.client?.name || "Sin cliente",
    q.status,
    `$${q.total.toFixed(2)}`,
    `$${(q.realUtilityTotal || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] }, // Red-600
    styles: { fontSize: 8 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalCosts = totalCollected - totalUtility;

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.rect(14, finalY, pageWidth - 28, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RESUMEN DE RESULTADOS", pageWidth / 2, finalY + 10, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total Ingresos (Cobrado Real):", 20, finalY + 20);
  doc.setFont("helvetica", "bold");
  doc.text(`$${totalCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY + 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Total Gastos Operativos:", 20, finalY + 27);
  doc.setFont("helvetica", "bold");
  doc.text(`$${totalCosts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY + 27, { align: "right" });

  doc.setDrawColor(200);
  doc.line(20, finalY + 31, pageWidth - 20, finalY + 31);

  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text("UTILIDAD REAL NETA:", 20, finalY + 36);
  doc.text(`$${totalUtility.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY + 36, { align: "right" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer;
}
