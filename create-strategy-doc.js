const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
} = require("docx");
const fs = require("fs");

// Color palette
const colors = {
  primary: "1E3A5F",      // Deep blue
  secondary: "2E7D32",    // Green
  accent: "E65100",       // Orange
  headerBg: "E8F0F8",     // Light blue
  tableBorder: "CCCCCC",
  highlight: "FFF3E0",    // Light orange
};

// Reusable border
const border = { style: BorderStyle.SINGLE, size: 1, color: colors.tableBorder };
const borders = { top: border, bottom: border, left: border, right: border };

// Helper for creating styled paragraphs
function styledParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 200 },
    ...options,
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 24,
        ...options.run,
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: colors.primary })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: colors.primary })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: colors.secondary })],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

function boldBodyText(boldPart, normalPart) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: boldPart, font: "Arial", size: 22, bold: true }),
      new TextRun({ text: normalPart, font: "Arial", size: 22 }),
    ],
  });
}

function calloutBox(title, content) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: colors.highlight, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: title, font: "Arial", size: 24, bold: true, color: colors.accent })],
              }),
              new Paragraph({
                children: [new TextRun({ text: content, font: "Arial", size: 22 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Create the document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: colors.primary },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: colors.primary },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: colors.secondary },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "○",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "phases",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "Phase %1:",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 720 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "DealForge Strategic Vision", font: "Arial", size: 18, color: "666666" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", font: "Arial", size: 18, color: "666666" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "666666" }),
                new TextRun({ text: " | Confidential", font: "Arial", size: 18, color: "666666" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // TITLE PAGE
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "DEALFORGE",
              font: "Arial",
              size: 72,
              bold: true,
              color: colors.primary,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "Texas Mobile Home Deal Intelligence Platform",
              font: "Arial",
              size: 32,
              color: colors.secondary,
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Strategic Vision & Implementation Plan",
              font: "Arial",
              size: 28,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
          children: [
            new TextRun({
              text: "January 2026",
              font: "Arial",
              size: 24,
              color: "666666",
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 1200 } }),
        calloutBox(
          "Core Value Proposition",
          "Transform openly available Texas manufactured housing data into actionable deal intelligence—helping RBI license holders and land developers identify, analyze, and close mobile home park acquisitions and land development opportunities faster than the competition."
        ),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // EXECUTIVE SUMMARY
        heading1("Executive Summary"),

        heading2("The Opportunity"),
        bodyText(
          "Texas maintains one of the most comprehensive manufactured housing datasets in the country through TDHCA (Texas Department of Housing and Community Affairs). This data—including ownership records, tax liens, titling activity, and license holder information—is publicly available but fragmented and difficult to use. No one is effectively aggregating and analyzing this data for investors."
        ),
        bodyText(
          "Combined with PUC utility service area boundaries, county parcel data, and FEMA flood zones, we can build a deal intelligence platform that surfaces opportunities invisible to competitors relying on traditional deal sourcing methods."
        ),

        heading2("Strategic Focus: RBI-Powered Deal Flow"),
        bodyText(
          "Your colleague's RBI (Retailer/Broker/Installer) license is a critical competitive advantage. Unlike passive investors who can only purchase existing parks, an RBI license holder can:"
        ),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Develop raw land into new MH communities", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Work directly with 21st Century Mortgage for land+home financing", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Partner with manufactured home builders for new inventory", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Convert distressed parks or land into profitable developments", font: "Arial", size: 22 })],
        }),
        bodyText(
          "DealForge should be built to maximize the value of this license—surfacing not just park acquisitions, but land development opportunities, distressed assets, and market inefficiencies that only an RBI can capitalize on."
        ),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // THE DATA ECOSYSTEM
        heading1("The Data Ecosystem"),

        heading2("Primary Data Source: TDHCA MHWeb"),
        bodyText(
          "The Texas Department of Housing and Community Affairs Manufactured Housing Division maintains comprehensive records accessible through mhweb.tdhca.state.tx.us:"
        ),

        // TDHCA Data Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [3000, 3000, 3360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Data Type", font: "Arial", size: 22, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Fields", font: "Arial", size: 22, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3360, type: WidthType.DXA },
                  shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Deal Intelligence Value", font: "Arial", size: 22, bold: true })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Ownership Records", font: "Arial", size: 20, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Serial #, HUD label, owner, address, county, liens", font: "Arial", size: 20 })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Identify parks by clustering titles at same address; track ownership changes", font: "Arial", size: 20 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Tax Lien Records", font: "Arial", size: 20, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Amount, tax year, status, county, taxing entity", font: "Arial", size: 20 })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Distress signals—parks with high lien concentration are acquisition targets", font: "Arial", size: 20 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Monthly Titling Reports", font: "Arial", size: 20, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "New titles, transfers by county/month", font: "Arial", size: 20 })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Market momentum—which counties are hot/cooling; where demand exceeds supply", font: "Arial", size: 20 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "License Holder Database", font: "Arial", size: 20, bold: true })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Active retailers, installers, manufacturers, brokers", font: "Arial", size: 20 })] })],
                }),
                new TableCell({
                  borders,
                  width: { size: 3360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Build partner network; identify potential JV opportunities; competitive intel", font: "Arial", size: 20 })] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        heading2("Infrastructure Intelligence: PUC CCN Data"),
        bodyText(
          "The Public Utility Commission of Texas maintains GIS shapefiles of all Certificate of Convenience and Necessity (CCN) service areas. This data is gold for land development feasibility:"
        ),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Water CCN boundaries: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Shows where municipal water service is available", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Sewer CCN boundaries: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Shows where sewer service is available", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "CCN Facility lines: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Shows actual infrastructure proximity to parcels", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Updated quarterly from puc.texas.gov/industry/water/utilities/gis/", font: "Arial", size: 22 })],
        }),

        calloutBox(
          "Why This Matters for RBI Developers",
          "A parcel inside a water/sewer CCN is dramatically more valuable for MH development than one requiring well/septic. 21st Century Mortgage strongly prefers financing land+home packages with municipal utilities. This data layer alone can surface land opportunities others miss."
        ),

        new Paragraph({ spacing: { after: 200 } }),

        heading2("Supporting Data Sources"),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "TxGIO/TNRIS Land Parcels: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Statewide parcel boundaries with owner info (free download)", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "FEMA NFHL: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Flood zone boundaries for risk assessment", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "County CAD Data: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Property values, zoning, land use classifications", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "HUD Fair Market Rents: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Lot rent benchmarking by geography", font: "Arial", size: 22 }),
          ],
        }),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // RENEWED VISION
        heading1("Renewed Vision: AI-Powered Deal Intelligence"),

        heading2("From Data to Decisions"),
        bodyText(
          "The core insight is that raw data is useless without analysis. DealForge should not just be a data aggregator—it should be an intelligent deal-finding assistant that synthesizes multiple data sources to surface actionable opportunities."
        ),

        heading3("Three Pillars of Intelligence"),

        boldBodyText("1. Park Acquisition Intelligence", ""),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Identify existing parks from title clustering patterns", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Score parks by distress signals (tax liens, aging homes, declining titlings)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Track ownership changes and off-market indicators", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "AI analysis of park potential based on infrastructure, market, demographics", font: "Arial", size: 22 })],
        }),

        boldBodyText("2. Land Development Intelligence", ""),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Surface parcels with optimal development characteristics:", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Inside water/sewer CCN (no well/septic needed)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Outside flood zones (reduced insurance/risk)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Appropriate zoning or re-zoning potential", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Strong market demand (titling activity trends)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Feasibility scoring for new MH community development", font: "Arial", size: 22 })],
        }),

        boldBodyText("3. Market Intelligence", ""),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "County/region market momentum from titling trends", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Supply/demand analysis (homes placed vs. land available)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Competitive landscape (other RBIs, retailers active in area)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Demographic overlays predicting future demand", font: "Arial", size: 22 })],
        }),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // AI-POWERED FEATURES
        heading1("AI-Powered Feature Concepts"),

        heading2("Deal Scout AI"),
        bodyText(
          'An AI assistant that actively searches for deals matching your criteria. Instead of manually scanning maps and filtering data, describe what you\'re looking for:'
        ),

        calloutBox(
          "Example Query",
          '"Find me distressed mobile home parks in South Texas counties with at least 20 lots, within a water CCN, where the owner has accumulated tax liens in the past 2 years."'
        ),

        new Paragraph({ spacing: { after: 200 } }),
        bodyText("The AI would synthesize TDHCA ownership data, tax lien records, CCN boundaries, and county data to return a ranked list of opportunities with analysis."),

        heading2("Parcel Analysis AI"),
        bodyText("Point at any parcel on the map and get instant AI analysis:"),

        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Development feasibility score ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "(based on utilities, flood, zoning, access)", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Estimated development costs ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "(rough pro forma based on lot count potential)", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Market fit analysis ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "(demand indicators, competition, rent potential)", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Risk factors ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "(flood proximity, environmental concerns, zoning challenges)", font: "Arial", size: 22 }),
          ],
        }),

        heading2("Due Diligence Assistant"),
        bodyText(
          "When you identify a deal, the AI helps you through the due diligence process:"
        ),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Automatically pulls all TDHCA records for homes in the park", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Checks for outstanding tax liens", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Verifies utility service availability", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Generates flood zone report", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Creates preliminary underwriting model", font: "Arial", size: 22 })],
        }),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // IMPLEMENTATION PHASES
        heading1("Implementation Roadmap"),

        heading2("Phase 1: Data Foundation (Weeks 1-4)"),
        bodyText("Build the data ingestion and storage layer to power all downstream features."),

        heading3("TDHCA Data Pipeline"),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Build scraper/downloader for TDHCA ownership records CSV", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Build parser for tax lien records", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Build license holder database sync", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Implement park detection algorithm (cluster titles by address)", font: "Arial", size: 22 })],
        }),

        heading3("Infrastructure Data Pipeline"),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Download and process PUC CCN shapefiles (water + sewer)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Import to PostGIS for spatial queries", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Build API endpoints for \"is this point in a CCN\" queries", font: "Arial", size: 22 })],
        }),

        heading2("Phase 2: Map Intelligence (Weeks 5-8)"),
        bodyText("Create the visual layer that makes data explorable."),

        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Interactive map with park pins (color-coded by distress score)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Toggle layers: CCN water, CCN sewer, flood zones", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Park detail panel showing all aggregated intelligence", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "County market dashboard with titling trends", font: "Arial", size: 22 })],
        }),

        heading2("Phase 3: AI Intelligence Layer (Weeks 9-12)"),
        bodyText("Add the AI features that turn data into decisions."),

        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Deal Scout AI with natural language queries", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Parcel analysis AI with feasibility scoring", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Due diligence assistant with automated report generation", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Opportunity alerts (email/SMS when matches found)", font: "Arial", size: 22 })],
        }),

        heading2("Phase 4: Deal Workflow (Weeks 13-16)"),
        bodyText("Complete the deal lifecycle from discovery to close."),

        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Saved deals library with status tracking", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Full underwriting calculator (park acquisition + land development)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "PDF export for lenders/partners", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "21st Century Mortgage integration checklist", font: "Arial", size: 22 })],
        }),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // RECOMMENDED FIRST EPIC
        heading1("Recommended First Epic: TDHCA Data Intelligence"),

        calloutBox(
          "Epic Goal",
          "Ingest TDHCA ownership and tax lien data, build park detection algorithm, and create the foundation for all AI-powered deal intelligence features."
        ),

        new Paragraph({ spacing: { after: 200 } }),

        heading2("Why Start Here"),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Unique data advantage: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "No competitor is systematically analyzing TDHCA data", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Foundation for AI: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Every AI feature depends on this data layer", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Immediate value: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Tax lien detection alone surfaces acquisition opportunities", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Builds database schema: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "You already have the schema started in tdhca.ts", font: "Arial", size: 22 }),
          ],
        }),

        heading2("Epic Breakdown"),

        heading3("Story 1: TDHCA Ownership Data Ingestion"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Acceptance Criteria:", font: "Arial", size: 22, bold: true })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Can download ownership records CSV from TDHCA by county", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Parse all fields into mh_ownership_records table", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Handle incremental updates (upsert by certificate number)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Initial load for 5 target counties", font: "Arial", size: 22 })],
        }),

        heading3("Story 2: Tax Lien Data Ingestion"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Acceptance Criteria:", font: "Arial", size: 22, bold: true })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Can download tax lien records from TDHCA", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Parse into mh_tax_liens table with amount, status, dates", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Link liens to ownership records by serial number", font: "Arial", size: 22 })],
        }),

        heading3("Story 3: Park Detection Algorithm"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Acceptance Criteria:", font: "Arial", size: 22, bold: true })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Cluster ownership records by install address + city", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Flag addresses with 5+ homes as potential parks", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Geocode park addresses (batch via geocoding API)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Create/update mh_communities records from detected parks", font: "Arial", size: 22 })],
        }),

        heading3("Story 4: Distress Score Calculation"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Acceptance Criteria:", font: "Arial", size: 22, bold: true })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Calculate distress score for each detected park based on:", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Percentage of homes with active tax liens", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Total lien amount relative to estimated park value", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Average age of homes in park", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Recent titling activity (declining = higher distress)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Store score on mh_communities record", font: "Arial", size: 22 })],
        }),

        heading3("Story 5: Park Detail API"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Acceptance Criteria:", font: "Arial", size: 22, bold: true })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "API endpoint returns full park intelligence:", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Basic info (name, address, lot count, distress score)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "All MH ownership records at that address", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 100 },
          children: [new TextRun({ text: "Tax lien summary (count, total amount, breakdown)", font: "Arial", size: 22 })],
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 1 },
          spacing: { after: 200 },
          children: [new TextRun({ text: "Recent titling activity for the park", font: "Arial", size: 22 })],
        }),

        // PAGE BREAK
        new Paragraph({ children: [new PageBreak()] }),

        // CLOSING
        heading1("Next Steps"),

        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Review and approve this strategic direction ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "— ensure alignment with business goals", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Manually test TDHCA data downloads ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "— verify we can access ownership records and tax liens", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Begin Epic 1, Story 1 ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "— build the ownership data ingestion pipeline", font: "Arial", size: 22 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Download PUC CCN shapefiles ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "— prepare for Phase 2 infrastructure layer", font: "Arial", size: 22 }),
          ],
        }),

        new Paragraph({ spacing: { before: 400 } }),

        calloutBox(
          "The Vision",
          "DealForge becomes the first AI-powered deal intelligence platform for Texas mobile home investors and RBI developers—transforming publicly available data into a competitive advantage that surfaces opportunities others miss and accelerates the path from discovery to close."
        ),

        new Paragraph({ spacing: { before: 400 } }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "— End of Document —", font: "Arial", size: 20, color: "666666", italics: true }),
          ],
        }),
      ],
    },
  ],
});

// Generate the document
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/sessions/ecstatic-dazzling-volta/mnt/dealforge/DEALFORGE_STRATEGIC_VISION.docx", buffer);
  console.log("Document created: DEALFORGE_STRATEGIC_VISION.docx");
});
