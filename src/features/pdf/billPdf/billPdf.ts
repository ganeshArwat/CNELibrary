import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import cneLogo from "@/images/Cnelogo.png";

import { drawLineOnPage, multiCell } from "@/utils/pdfHelpers";
import { formatDate, formatIndianAmount } from "@/lib/helperFn";

const userList = [
  {
    id: 1,
    name: "Ganesh Arwat",
    username: "Ganesh",
    email: "ganesh@example.com",
  },
  {
    id: 2,
    name: "Swapnil Mane",
    username: "Swapnil",
    email: "swapnil@example.com",
  },
  {
    id: 3,
    name: "Pranay Giradkar",
    username: "Pranay",
    email: "pranay@example.com",
  },
  { id: 4, name: "Rohit Pawar", username: "Rohit", email: "rohit@example.com" },
  {
    id: 5,
    name: "AbdulRaheman Sayyed",
    username: "Raheman",
    email: "raheman@example.com",
  },
];

const getUserName = (id: number) =>
  userList.find((u) => u.id === id)?.username || `User ${id}`;

function header(page, pngImage, hy, pngDims) {
  page.drawImage(pngImage, {
    x: 25,
    y: hy - 100,
    width: pngDims.width,
    height: pngDims.height,
  });

  return hy - 100;
}

export async function generateBillPdf(billData) {
  const pdfDoc = await PDFDocument.create();
  const Helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const HelveticaB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([600, 800]); // width x height

  const { height } = page.getSize();

  // logo
  const pngUrl = cneLogo;
  const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer());
  const pngImage = await pdfDoc.embedPng(pngImageBytes);
  const pngDims = pngImage.scale(0.4);

  let hy = 800;
  let lx = 0;
  let fontSize = 11;
  let lines = [];
  let lastLine = { x: 0, y: 0 };

  hy = header(page, pngImage, hy, pngDims);
  fontSize = 15;
  lines = [
    {
      text: `CNE Expense`,
      isBold: true,
      textColor: { r: 55 / 255, g: 65 / 255, b: 81 / 255 },
    },
  ]; // rgb(55, 65, 81)
  lastLine = multiCell(page, lines, {
    x: 100,
    y: hy + 30,
    maxWidth: 550,
    fontSize: fontSize,
    normalFont: Helvetica,
    boldFont: HelveticaB,
    align: `left`,
  });

  lines = [{ text: `Bill Summary`, isBold: true }];
  lastLine = multiCell(page, lines, {
    x: 25,
    y: hy - 20,
    maxWidth: 550,
    fontSize: fontSize,
    normalFont: Helvetica,
    boldFont: HelveticaB,
    align: `center`,
  });

  fontSize = 12;
  hy = lastLine.y - 25;
  lines = [
    { text: `Date: <textbold> ${formatDate(billData.billDate)} </textbold> `, isBold: false },
  ];
  lastLine = multiCell(page, lines, {
    x: 25,
    y: hy - 20,
    maxWidth: 550,
    fontSize: fontSize,
    normalFont: Helvetica,
    boldFont: HelveticaB,
    align: `left`,
  });

  lines = [
    { text: `Venue:  <textbold> ${billData.venue} </textbold> `, isBold: false },
  ];
  lastLine = multiCell(page, lines, {
    x: 25,
    y: hy - 20,
    maxWidth: 550,
    fontSize: fontSize,
    normalFont: Helvetica,
    boldFont: HelveticaB,
    align: `right`,
  });

  hy = lastLine.y - 15;

  drawLineOnPage(page, 25, hy, 575, hy, {
    style: "dashed",
    color: { r: 0.6, g: 0.6, b: 0.6 },
    thickness: 1,
    dashLength: 6,
    gapLength: 3,
  });

  const entries = Object.entries(billData.userDetails);
  for (let i = 0; i < entries.length; i++) {
    const [uid, detail] = entries[i];

    lines = [
      {
        text: `<textbold> ${getUserName(parseInt(uid))} </textbold> `,
        isBold: false,
      },
    ];
    lastLine = multiCell(page, lines, {
      x: 25,
      y: hy - 20,
      maxWidth: 550,
      fontSize: fontSize,
      normalFont: Helvetica,
      boldFont: HelveticaB,
      align: `left`,
    });
    lines = [
      {
        text: `<textbold> ${detail.total.toFixed(2)} </textbold> `,
        isBold: false,
      },
    ];
    lastLine = multiCell(page, lines, {
      x: 25,
      y: hy - 20,
      maxWidth: 550,
      fontSize: fontSize,
      normalFont: Helvetica,
      boldFont: HelveticaB,
      align: `right`,
    });

    for (let idx = 0; idx < detail.items.length; idx++) {
      fontSize = 11;
      hy = lastLine.y;
      const itm = detail.items[idx];
      lines = [
        {
          text: `${itm.name} `,
          isBold: false,
        },
      ];
      lastLine = multiCell(page, lines, {
        x: 25,
        y: hy - 20,
        maxWidth: 550,
        fontSize: fontSize,
        normalFont: Helvetica,
        boldFont: HelveticaB,
        align: `left`,
      });
      lines = [
        {
          text: `${itm.share.toFixed(2)}`,
          isBold: false,
        },
      ];
      lastLine = multiCell(page, lines, {
        x: 25,
        y: hy - 20,
        maxWidth: 545,
        fontSize: fontSize,
        normalFont: Helvetica,
        boldFont: HelveticaB,
        align: `right`,
      });
    }
    fontSize = 12;

    hy = lastLine.y - 15;
  }

  drawLineOnPage(page, 25, hy, 575, hy, {
    style: "dashed",
    color: { r: 0.6, g: 0.6, b: 0.6 },
    thickness: 1,
    dashLength: 6,
    gapLength: 3,
  });


  lines = [
      {
        text: `<textbold> Grand Total </textbold> `,
        isBold: false,
      },
    ];
    lastLine = multiCell(page, lines, {
      x: 25,
      y: hy - 20,
      maxWidth: 550,
      fontSize: fontSize,
      normalFont: Helvetica,
      boldFont: HelveticaB,
      align: `left`,
    });
    lines = [
      {
        text: `<textbold> ${billData.grandTotal.toFixed(2)} </textbold> `,
        isBold: false,
      },
    ];
    lastLine = multiCell(page, lines, {
      x: 25,
      y: hy - 20,
      maxWidth: 550,
      fontSize: fontSize,
      normalFont: Helvetica,
      boldFont: HelveticaB,
      align: `right`,
    });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  return {
    url: URL.createObjectURL(blob),
    file: new File([blob], `bill.pdf`, {
      type: "application/pdf",
    }),
  };
}
