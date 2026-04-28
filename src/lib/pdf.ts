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
  doc.text(`No. de Cotización:   ${quote.folio}`, pageWidth - 14, 42, { align: "right" });

  // Top Left Details (Client & Project)
  let currentY = 36;

  // Show registered client OR prospect name
  const displayName = quote.client?.name || quote.prospectName;
  const displayCompany = quote.client?.company;

  if (displayName) {
    doc.setFont("helvetica", "normal");
    doc.text("PARA:", 14, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(displayName, 35, currentY);
    currentY += 6;
    if (displayCompany) {
      doc.setFont("helvetica", "normal");
      doc.text(displayCompany, 35, currentY);
      currentY += 6;
    }
    if (!quote.client && quote.prospectName) {
      currentY += 2;
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

  // Concepts Table — headers: Descripción | Cant | Detalles | Importe Unitario | Importe
  const tableColumn = ["Descripción", "Cant", "Detalles", "Importe Unitario", "Importe"];
  const tableRows: any[][] = [];
  const fmt = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const drawHeader = (d: jsPDF) => {
    try {
      const logoPath = path.join(process.cwd(), "public", "logo_pdf.png");
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      d.addImage(logoBase64, "PNG", 14, 10, 50, 15);
    } catch (error) {
      d.setFont("helvetica", "bolditalic");
      d.setFontSize(24);
      d.text("LASER INOVA", 14, 22);
    }
    d.setFont("helvetica", "bold");
    d.setFontSize(22);
    d.text("COTIZACIÓN", pageWidth / 2, 22, { align: "center" });
    d.setDrawColor(0);
    d.setLineWidth(0.5);
    d.line(14, 30, pageWidth - 14, 30);
  };

  const drawFooter = (d: jsPDF) => {
    const pHeight = d.internal.pageSize.height;
    const footerY = pHeight - 30;
    d.setDrawColor(0);
    d.setLineWidth(0.5);
    d.line(14, footerY, pageWidth - 14, footerY);
    d.setFont("helvetica", "bold");
    d.setFontSize(9);
    d.setTextColor(0);
    d.text("www.laserinova.com", 14, footerY + 6);
    d.text("info@laserinova.com", pageWidth - 14, footerY + 6, { align: "right" });
  };

  // Initial header
  drawHeader(doc);

  quote.concepts.forEach((concept: any) => {
    let detalles = concept.details || "";
    if (!detalles) {
      const parts = [];
      if (concept.conceptType === "CORTE" || concept.conceptType === "GRABADO") {
        parts.push(`Servicio de ${concept.conceptType.toLowerCase()}`);
        if (concept.material) parts.push(`en ${concept.material.name}`);
        if (concept.width && concept.height) parts.push(`Medidas: ${concept.width}x${concept.height}cm`);
        if (concept.clientProvidesMaterial) parts.push(`(Material proporcionado por el cliente)`);
      } else if (concept.conceptType === "RESALE") {
        parts.push("Artículo de reventa");
      }
      detalles = parts.join(". ") + (parts.length > 0 ? "." : "");
    }

    let unitPrice = concept.finalUnitPrice ?? 0;
    let total = unitPrice * concept.quantity;

    if (quote.taxable && quote.subtotal > 0) {
      const taxFactor = 1 + (quote.tax / quote.subtotal);
      unitPrice = unitPrice / taxFactor;
      total = total / taxFactor;
    }

    tableRows.push([
      concept.description,
      concept.quantity.toString(),
      detalles,
      fmt(unitPrice),
      fmt(total),
    ]);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    theme: "striped",
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 10, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: 50 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" }
    },
    margin: { top: 35, bottom: 40 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(doc);
      }
      drawFooter(doc);
    }
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

  // Footer / Consideraciones
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  
  const rawConsiderations = quote.visibleConsiderations || 
    "- Tiempo de entrega: de 1 a 3 días hábiles.\n- 50% anticipo, 50% al programar envío o entrega.\n- El costo puede variar si hay cambios en medidas o diseño.\n- Vigencia de cotización 20 días.";

  const considerationsLines = [
    "- Consideraciones:",
    ...rawConsiderations.split("\n")
  ];

  const maxWidth = pageWidth - 28;
  const wrappedLines: string[] = [];
  considerationsLines.forEach(line => {
    const split = doc.splitTextToSize(line, maxWidth);
    if (Array.isArray(split)) {
      wrappedLines.push(...split);
    } else {
      wrappedLines.push(split);
    }
  });

  const pageHeight = doc.internal.pageSize.height;
  const marginThreshold = pageHeight - 35;
  let currentTextY = totalsY + 30;

  if (currentTextY > marginThreshold - 10) {
    doc.addPage();
    drawHeader(doc);
    drawFooter(doc);
    currentTextY = 40;
  }

  wrappedLines.forEach(line => {
    if (currentTextY > marginThreshold) {
      doc.addPage();
      drawHeader(doc);
      drawFooter(doc);
      currentTextY = 40;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(line, 14, currentTextY);
    currentTextY += 5;
  });

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
