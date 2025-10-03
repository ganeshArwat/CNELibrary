import { rgb, PDFPage, PDFFont, PDFDocument } from "pdf-lib"; // 👈 make sure you import what you need

export type RichTextPart = {
  text: string;
  isBold?: boolean;
  underline?: boolean;
  textColor?: { r: number; g: number; b: number };
  bgColor?: { r: number; g: number; b: number };
};

export type DrawRichTextOptions = {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  lineHeight?: number;
  normalFont: PDFFont;
  boldFont: PDFFont;
  cellHeight?: number;
  minWidth?: number;
  align?:
    | "left"
    | "center"
    | "right"
    | "cell-left"
    | "cell-center"
    | "cell-right";
  outline?: {
    thickness: number;
    color: { r: number; g: number; b: number };
    backgroundColor?: { r: number; g: number; b: number };
  };
};

export type TableColumn = {
  key: string; // column name
  width: number;
  align?: "cell-left" | "cell-center" | "cell-right";
};

export type TableRow<Columns extends readonly TableColumn[]> = {
  [K in Columns[number]["key"]]?: string | number | boolean;
} & {
  isBold?: boolean;
  colSpan?: number;
  backgroundColor?: { r: number; g: number; b: number };
};

export function addNewPage(pdfDoc: PDFDocument, pages: Array<PDFPage>) {
  const newPage = pdfDoc.addPage([600, 800]);
  pages.push(newPage);
  return newPage;
}

/*
 // Rich text parts (mixed bold, underline, colors, etc.)
  const content = [
    { text: "Hello", isBold: true, underline: true, textColor: { r: 1, g: 0, b: 0 } }, // red bold underlined
    { text: "world,", isBold: false, textColor: { r: 0, g: 0.5, b: 0 } },               // green
    { text: "this is a", isBold: false },
    { text: "multiCell", isBold: true, bgColor: { r: 0.9, g: 0.9, b: 0.2 } },          // yellow highlight
    { text: "example.", isBold: false, textColor: { r: 0, g: 0, b: 1 } },              // blue
  ];

  multiCell(page, content, {
    x: 50,
    y: 700,
    maxWidth: 300,
    minWidth: 200, // 👈 Ensures cell has at least 200px width
    fontSize: 14,
    normalFont,
    boldFont,
    lineHeight: 20, // 👈 Optional custom line height
    align: "cell-center", // 👈 Align text inside the cell
    outline: {
      thickness: 1.5,
      color: { r: 0, g: 0, b: 0 }, // black border
      backgroundColor: { r: 0.95, g: 0.95, b: 0.95 }, // light gray background
    },
  });

*/

export function multiCell(
  page: PDFPage,
  content: RichTextPart[],
  opts: DrawRichTextOptions
) {
  const {
    x,
    y,
    maxWidth,
    minWidth = 0,
    fontSize,
    normalFont,
    boldFont,
    align = "left",
    lineHeight: lh,
    outline,
  } = opts;
  const lineHeight = lh ?? fontSize * 1.2;

  let cursorX = x;
  let cursorY = y;
  let lineCount = 0;
  let boldActive = false;

  const wordsWithFont: {
    word: string;
    font: PDFFont;
    underline?: boolean;
    textColor?: { r: number; g: number; b: number };
    bgColor?: { r: number; g: number; b: number };
  }[] = [];

  for (const part of content) {
    const baseFont = part.isBold ? boldFont : normalFont;
    const words = part.text.split(" ");
    for (const word of words) {
      if (word === "<textbold>") {
        boldActive = true;
        continue;
      }
      if (word === "</textbold>") {
        boldActive = false;
        continue;
      }
      wordsWithFont.push({
        word: word + " ",
        font: boldActive ? boldFont : baseFont,
        underline: part.underline,
        textColor: part.textColor,
        bgColor: part.bgColor,
      });
    }
  }

  let lineWords: typeof wordsWithFont = [];
  let lineWidth = 0;
  let requiredWidth = 0;
  for (const wf of wordsWithFont) {
    const w = wf.font.widthOfTextAtSize(wf.word, fontSize);
    if (wf.word === "<linebr> ") {
      cursorX = drawLine(lineWords, lineWidth, cursorY);
      lineCount++;
      requiredWidth = Math.max(requiredWidth, lineWidth);
      cursorY -= lineHeight;
      lineWords = [];
      lineWidth = 0;
      continue;
    }

    if (lineWidth + w > maxWidth) {
      cursorX = drawLine(lineWords, lineWidth, cursorY);
      lineCount++;
      requiredWidth = Math.max(requiredWidth, lineWidth);
      cursorY -= lineHeight;
      lineWords = [];
      lineWidth = 0;
    }

    lineWords.push(wf);
    lineWidth += w;
  }

  if (lineWords.length > 0) {
    cursorX = drawLine(lineWords, lineWidth, cursorY);
    lineCount++;

    requiredWidth = Math.max(requiredWidth, lineWidth);
  }

  if (outline) {
    const MrectX = x;
    const MrectY = cursorY - fontSize * 0.2;
    const MrectW = maxWidth;
    const MrectH = fontSize * 1.2 * lineCount;

    page.drawRectangle({
      x: MrectX,
      y: MrectY,
      width: MrectW,
      height: MrectH,
      borderColor: rgb(outline.color.r, outline.color.g, outline.color.b),
      borderWidth: outline.thickness,
    });
  }

  return {
    x: Math.max(minWidth, lineWidth),
    y: cursorY,
    requiredWidth: Math.max(requiredWidth, minWidth),
  };

  function drawLine(
    words: typeof wordsWithFont,
    lineWidth: number,
    yPos: number
  ) {
    const effectiveWidth = Math.max(lineWidth, minWidth);
    let startX = x;

    if (align === "center") startX = x + (maxWidth - lineWidth) / 2;
    else if (align === "right") startX = x + (maxWidth - lineWidth);
    else if (align === "cell-center")
      startX = x + (effectiveWidth - lineWidth) / 2;
    else if (align === "cell-right") startX = x + (effectiveWidth - lineWidth);

    // Cell background + border
    if (outline) {
      const rectX = x;
      const rectY = yPos - fontSize * 0.2;
      const rectW = effectiveWidth;
      const rectH = fontSize * 1.2;

      if (outline.backgroundColor) {
        page.drawRectangle({
          x: rectX,
          y: rectY,
          width: rectW,
          height: rectH,
          color: rgb(
            outline.backgroundColor.r,
            outline.backgroundColor.g,
            outline.backgroundColor.b
          ),
        });
      }
    }

    // Draw words
    let lx = startX;
    for (const lw of words) {
      if (lw.bgColor) {
        page.drawRectangle({
          x: lx,
          y: yPos - fontSize * 0.2,
          width: lw.font.widthOfTextAtSize(lw.word, fontSize),
          height: fontSize * 1.2,
          color: rgb(lw.bgColor.r, lw.bgColor.g, lw.bgColor.b),
        });
      }

      page.drawText(lw.word, {
        x: lx,
        y: yPos,
        size: fontSize,
        font: lw.font,
        color: lw.textColor
          ? rgb(lw.textColor.r, lw.textColor.g, lw.textColor.b)
          : undefined,
      });

      if (lw.underline) {
        page.drawLine({
          start: { x: lx, y: yPos - 2 },
          end: {
            x: lx + lw.font.widthOfTextAtSize(lw.word, fontSize),
            y: yPos - 2,
          },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
      }

      lx += lw.font.widthOfTextAtSize(lw.word, fontSize);
    }

    return lx;
  }
}

/** --- DRAW TABLE FUNCTION --- **/
export function drawTable(
  page: PDFPage,
  tableData: Array<TableRow>,
  columnDefs: Array<TableColumn>,
  hx: number,
  hy: number,
  normalFont: PDFFont,
  boldFont: PDFFont
) {
  let lastLine = { x: hx, y: hy };
  for (const row of tableData) {
    let lx = 0;
    let colIndex = 0;

    while (colIndex < columnDefs.length) {
      const col = columnDefs[colIndex];

      // Check if row wants to span
      const span = row.colSpan && colIndex === 0 ? row.colSpan : 1;
      const spanCols = columnDefs.slice(colIndex, colIndex + span);
      const totalWidth = spanCols.reduce((w, c) => w + c.width, 0);

      const value = row[col.key as keyof typeof row] as string;

      const lines = [
        {
          text: value ?? ``,
          isBold: row.isBold ?? false,
        },
      ];

      lastLine = multiCell(page, lines, {
        x: 25 + lx,
        y: hy,
        maxWidth: totalWidth,
        minWidth: totalWidth,
        fontSize: 11,
        normalFont,
        boldFont,
        align: span === 1 ? (col.align as any) : `cell-left`, // if span, left align
        outline: {
          thickness: 1,
          color: { r: 0, g: 0, b: 0 },
          backgroundColor: row.backgroundColor,
        },
      });

      lx += totalWidth;
      colIndex += span; // skip spanned columns
    }

    hy = lastLine.y - 14;
  }

  return hy;
}

// Draw a separator line under the header
// drawLineOnPage(page, 25, 740, 575, 740, {
//   color: { r: 0.2, g: 0.2, b: 0.2 },
//   thickness: 1,
// });

// drawLineOnPage(page, 25, 700, 575, 700, {
//   style: "dashed", "dotted"
//   color: { r: 0.6, g: 0.6, b: 0.6 },
//   thickness: 1,
//   dashLength: 6,
//   gapLength: 3,
// });

export function drawLineOnPage(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: {
    color?: { r: number; g: number; b: number };
    thickness?: number;
    style?: "solid" | "dashed" | "dotted";
    dashLength?: number;   // length of dash in pts (default 4)
    gapLength?: number;    // length of gap in pts (default 2)
  }
) {
  const {
    color = { r: 0, g: 0, b: 0 },
    thickness = 1,
    style = "solid",
    dashLength = 4,
    gapLength = 2,
  } = options || {};

  if (style === "solid") {
    // Single continuous line
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color: rgb(color.r, color.g, color.b),
    });
    return;
  }

  // Dashed or dotted => break into small segments
  const totalLength = Math.hypot(x2 - x1, y2 - y1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const ux = dx / totalLength; // unit vector
  const uy = dy / totalLength;

  const segLength = style === "dotted" ? thickness : dashLength;
  const gap = style === "dotted" ? segLength : gapLength;

  let drawn = 0;
  while (drawn + segLength <= totalLength) {
    const sx = x1 + ux * drawn;
    const sy = y1 + uy * drawn;
    const ex = x1 + ux * (drawn + segLength);
    const ey = y1 + uy * (drawn + segLength);
    page.drawLine({
      start: { x: sx, y: sy },
      end: { x: ex, y: ey },
      thickness,
      color: rgb(color.r, color.g, color.b),
    });
    drawn += segLength + gap;
  }
}

