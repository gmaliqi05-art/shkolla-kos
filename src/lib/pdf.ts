import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/*
  Vector PDF generation for official documents (dëftesa / certifikata / diploma).
  Uses jsPDF's standard Helvetica font, whose WinAnsi encoding covers Albanian
  diacritics (ë, ç). Documents include the school header, signature lines and a
  stamp area so they can be printed, signed and archived (UA 19/2018).
*/

const MARGIN = 40;

export interface SchoolHeader {
  name: string;
  municipality: string;
  address: string;
  registrationNumber: string;
  directorName: string;
}

export interface ReportCardPdfData {
  school: SchoolHeader;
  title: string;
  periodLabel: string;
  academicYear: string;
  student: {
    fullName: string;
    personalNumber: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    guardian: string;
  };
  className: string;
  isDescriptive: boolean;
  gradeHead: string[];
  gradeRows: string[][];
  average: string | null;
  behavior: string | null;
  attendance: { prezent: number; arsyeshme: number; mungon: number; vonese: number };
  serial: string;
  issuedDate: string;
}

export interface CertificatePdfData {
  school: SchoolHeader;
  title: string;
  body: string;
  student: {
    fullName: string;
    personalNumber: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
  };
  className: string;
  academicYear: string;
  serial: string;
  issuedDate: string;
}

function drawSchoolHeader(doc: jsPDF, school: SchoolHeader, rightTop?: { label: string; value: string }): number {
  const pageW = doc.internal.pageSize.getWidth();
  let y = MARGIN;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text('REPUBLIKA E KOSOVËS', MARGIN, y);
  y += 11;
  doc.text('Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit', MARGIN, y);
  y += 11;
  doc.text(`Komuna ${school.municipality || '________'}`, MARGIN, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(school.name || 'Shkolla', MARGIN, y);
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  if (school.address) { doc.text(school.address, MARGIN, y); y += 10; }
  if (school.registrationNumber) { doc.text(`Nr. regjistrimit: ${school.registrationNumber}`, MARGIN, y); y += 10; }

  if (rightTop) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(rightTop.label, pageW - MARGIN, MARGIN, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text(rightTop.value, pageW - MARGIN, MARGIN + 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }
  return y;
}

function drawSignatures(doc: jsPDF, y: number, leftTitle: string, rightTitle: string, rightName: string): number {
  const pageW = doc.internal.pageSize.getWidth();
  const colW = (pageW - MARGIN * 2) / 2;
  const lineY = y + 30;
  doc.setDrawColor(120);
  doc.line(MARGIN + 20, lineY, MARGIN + colW - 20, lineY);
  doc.line(MARGIN + colW + 20, lineY, pageW - MARGIN - 20, lineY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.text(leftTitle, MARGIN + colW / 2, lineY + 12, { align: 'center' });
  doc.text(rightTitle, MARGIN + colW + colW / 2, lineY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (rightName) doc.text(rightName, MARGIN + colW + colW / 2, lineY + 24, { align: 'center' });
  // Stamp area marker
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('(Vula)', MARGIN + colW + colW / 2, lineY + 40, { align: 'center' });
  return lineY + 48;
}

export function generateReportCardPdf(data: ReportCardPdfData): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawSchoolHeader(doc, data.school, { label: 'Viti shkollor', value: data.academicYear });

  // top rule
  y += 6;
  doc.setDrawColor(20);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  doc.setLineWidth(0.5);
  y += 22;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(data.title.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 16;
  if (data.periodLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(data.periodLabel, pageW / 2, y, { align: 'center' });
    y += 14;
  }
  y += 6;

  // Student info box
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: 30 },
    body: [
      ['Emri dhe mbiemri', data.student.fullName, 'Numri personal', data.student.personalNumber],
      ['Datëlindja', data.student.dateOfBirth, 'Vendlindja', data.student.placeOfBirth],
      ['Gjinia', data.student.gender, 'Klasa', data.className],
      ['Kujdestari ligjor', data.student.guardian, '', ''],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 90 },
      2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 90 },
    },
    margin: { left: MARGIN, right: MARGIN },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 18;

  // Grades
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text(data.isDescriptive ? 'Vlerësimi përshkrues' : 'Notat', MARGIN, y);
  y += 6;

  const gradeBody = [...data.gradeRows];
  if (!data.isDescriptive && data.average) {
    const avgRow = new Array(data.gradeHead.length).fill('');
    avgRow[0] = 'Mesatarja';
    avgRow[data.gradeHead.length - 1] = data.average;
    gradeBody.push(avgRow);
  }
  autoTable(doc, {
    startY: y,
    head: [data.gradeHead],
    body: gradeBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: 30 },
    margin: { left: MARGIN, right: MARGIN },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;

  if (data.behavior) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.text(`Sjellja: ${data.behavior}`, MARGIN, y);
    y += 16;
  }

  // Attendance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text('Frekuentimi', MARGIN, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Statusi', 'Numri']],
    body: [
      ['Prezent', String(data.attendance.prezent)],
      ['Mungesa të arsyetuara', String(data.attendance.arsyeshme)],
      ['Mungesa të paarsyetuara', String(data.attendance.mungon)],
      ['Vonesa', String(data.attendance.vonese)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: 30 },
    columnStyles: { 1: { halign: 'center', cellWidth: 80 } },
    margin: { left: MARGIN, right: MARGIN },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 20;

  y = drawSignatures(doc, y, 'Mësuesi/ja kujdestar/e', 'Drejtori/ja i/e Shkollës', data.school.directorName);

  doc.setFontSize(8);
  doc.setTextColor(120);
  const footer = `Nr. serik: ${data.serial || '—'}  ·  Lëshuar më: ${data.issuedDate}  ·  Vendi: ${data.school.municipality || '—'}`;
  doc.text(footer, pageW / 2, y + 16, { align: 'center' });

  doc.save(`${data.title.replace(/\s+/g, '_')}_${data.student.fullName.replace(/\s+/g, '_')}.pdf`);
}

export function generateCertificatePdf(data: CertificatePdfData): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Double border
  doc.setDrawColor(30);
  doc.setLineWidth(2);
  doc.rect(MARGIN / 2, MARGIN / 2, pageW - MARGIN, pageH - MARGIN);
  doc.setLineWidth(0.6);
  doc.rect(MARGIN / 2 + 6, MARGIN / 2 + 6, pageW - MARGIN - 12, pageH - MARGIN - 12);

  let y = MARGIN + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('REPUBLIKA E KOSOVËS', pageW / 2, y, { align: 'center' }); y += 12;
  doc.text('Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit', pageW / 2, y, { align: 'center' }); y += 12;
  doc.text(`Komuna ${data.school.municipality || '________'}`, pageW / 2, y, { align: 'center' }); y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(data.school.name || 'Shkolla', pageW / 2, y, { align: 'center' }); y += 40;

  // Title
  doc.setFontSize(28);
  doc.text(data.title.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 36;

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50);
  const bodyLines = doc.splitTextToSize(data.body, pageW - MARGIN * 2 - 60);
  doc.text(bodyLines, pageW / 2, y, { align: 'center' });
  y += bodyLines.length * 15 + 24;

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20);
  doc.text(data.student.fullName, pageW / 2, y, { align: 'center' });
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Numri personal: ${data.student.personalNumber || '__________'}`, pageW / 2, y, { align: 'center' }); y += 13;
  const born = `I/e lindur më ${data.student.dateOfBirth || '______'} në ${data.student.placeOfBirth || '______'}${data.student.gender ? ` · ${data.student.gender}` : ''}`;
  doc.text(born, pageW / 2, y, { align: 'center' }); y += 13;
  doc.text(`Klasa: ${data.className} · Viti shkollor: ${data.academicYear || '________'}`, pageW / 2, y, { align: 'center' });
  y += 50;

  // Serial (left) + signature (right)
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Nr. serik: ${data.serial || '____________'}`, MARGIN + 10, y);
  doc.text(`Lëshuar më: ${data.issuedDate}`, MARGIN + 10, y + 12);
  doc.text(`Vendi: ${data.school.municipality || '________'}`, MARGIN + 10, y + 24);

  const rcx = pageW - MARGIN - 150;
  doc.setDrawColor(120);
  doc.line(rcx, y + 6, rcx + 140, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.text('Drejtori/ja i/e Shkollës', rcx + 70, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (data.school.directorName) doc.text(data.school.directorName, rcx + 70, y + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('(Vula)', rcx + 70, y + 46, { align: 'center' });

  doc.save(`${data.title.replace(/\s+/g, '_')}_${data.student.fullName.replace(/\s+/g, '_')}.pdf`);
}
