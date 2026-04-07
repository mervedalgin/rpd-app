import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import DOMPurify from "isomorphic-dompurify";

/**
 * Basit HTML -> DOCX dönüştürücü.
 * TipTap editöründen gelen HTML'i parse ederek docx paragraflarına çevirir.
 */
export async function htmlToDocx(html: string, fileName: string): Promise<void> {
  const paragraphs = parseHtmlToParagraphs(html);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}

function parseHtmlToParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Temp div to parse HTML
  const div = document.createElement("div");
  div.innerHTML = DOMPurify.sanitize(html);

  function getAlignment(el: Element): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
    const style = (el as HTMLElement).style?.textAlign;
    if (style === "center") return AlignmentType.CENTER;
    if (style === "right") return AlignmentType.RIGHT;
    if (style === "justify") return AlignmentType.JUSTIFIED;
    return undefined;
  }

  function extractTextRuns(node: Node, inherited: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string } = {}): TextRun[] {
    const runs: TextRun[] = [];

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || "";
        if (text) {
          runs.push(new TextRun({
            text,
            bold: inherited.bold,
            italics: inherited.italic,
            underline: inherited.underline ? {} : undefined,
            strike: inherited.strike,
            color: inherited.color?.replace("#", ""),
            size: 22,
            font: "Times New Roman",
          }));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const newInherited = { ...inherited };

        if (tag === "strong" || tag === "b") newInherited.bold = true;
        if (tag === "em" || tag === "i") newInherited.italic = true;
        if (tag === "u") newInherited.underline = true;
        if (tag === "s" || tag === "del") newInherited.strike = true;
        if (tag === "span" && el.style.color) newInherited.color = el.style.color;
        if (tag === "mark") newInherited.color = "FFA500";

        if (tag === "br") {
          runs.push(new TextRun({ break: 1, size: 22, font: "Times New Roman" }));
        } else {
          runs.push(...extractTextRuns(el, newInherited));
        }
      }
    }

    return runs;
  }

  for (const child of Array.from(div.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent || "").trim();
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, size: 22, font: "Times New Roman" })],
        }));
      }
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const alignment = getAlignment(el);

    // Headings
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = tag === "h1" ? HeadingLevel.HEADING_1 : tag === "h2" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const fontSize = tag === "h1" ? 28 : tag === "h2" ? 24 : 22;
      const runs = extractTextRuns(el, { bold: true });
      // Override font size for heading runs
      const headingRuns = runs.length > 0 ? runs : [new TextRun({ text: el.textContent || "", bold: true, size: fontSize, font: "Times New Roman" })];
      paragraphs.push(new Paragraph({
        heading: level,
        alignment,
        spacing: { after: 120 },
        children: headingRuns,
      }));
      continue;
    }

    // Horizontal rule
    if (tag === "hr") {
      paragraphs.push(new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [new TextRun({ text: "─".repeat(60), size: 16, font: "Times New Roman", color: "999999" })],
      }));
      continue;
    }

    // Blockquote
    if (tag === "blockquote") {
      const runs = extractTextRuns(el, { italic: true });
      paragraphs.push(new Paragraph({
        alignment,
        spacing: { before: 100, after: 100 },
        indent: { left: 720 },
        children: runs.length > 0 ? runs : [new TextRun({ text: el.textContent || "", italics: true, size: 22, font: "Times New Roman" })],
      }));
      continue;
    }

    // Lists (ul, ol)
    if (tag === "ul" || tag === "ol") {
      const items = el.querySelectorAll("li");
      items.forEach((li, idx) => {
        const bullet = tag === "ul" ? "  •  " : `  ${idx + 1}.  `;
        const runs = extractTextRuns(li);
        paragraphs.push(new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: bullet, bold: true, size: 22, font: "Times New Roman" }),
            ...(runs.length > 0 ? runs : [new TextRun({ text: li.textContent || "", size: 22, font: "Times New Roman" })]),
          ],
        }));
      });
      continue;
    }

    // Paragraph / div / other block
    const runs = extractTextRuns(el);
    if (runs.length > 0) {
      paragraphs.push(new Paragraph({
        alignment,
        spacing: { after: 100 },
        children: runs,
      }));
    } else {
      const text = (el.textContent || "").trim();
      if (text) {
        paragraphs.push(new Paragraph({
          alignment,
          spacing: { after: 100 },
          children: [new TextRun({ text, size: 22, font: "Times New Roman" })],
        }));
      } else {
        // Empty paragraph (spacer)
        paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      }
    }
  }

  return paragraphs;
}
