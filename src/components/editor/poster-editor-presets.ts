import { v4 as uuid } from "uuid";
import { EDITOR_COLORS } from "./editor-theme";
import {
  type CreatePresetOptions,
  MOCK_BINDINGS,
  type PosterTemplateType,
  TEMPLATE_TYPES,
} from "./poster-editor-config";
import {
  presetBackground,
  TEMPLATE_COLOR_SCHEMES,
} from "./poster-editor-palettes";
import type {
  EditorBackground,
  EditorElement,
  PosterEditorDocument,
} from "./poster-editor-types";

function fieldText(
  bindingKey: string,
  x: number,
  y: number,
  fontSize: number,
  opts?: Partial<EditorElement>,
): EditorElement {
  const preview = MOCK_BINDINGS[bindingKey] ?? `{{${bindingKey}}}`;
  return {
    id: uuid(),
    type: "text",
    name: bindingKey,
    bindingKey,
    visible: true,
    x,
    y,
    text: preview,
    fontSize,
    fontFamily: "Outfit, system-ui, sans-serif",
    fill: EDITOR_COLORS.foreground,
    align: "left",
    zIndex: opts?.zIndex ?? 10,
    ...opts,
  };
}

function staticText(
  name: string,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  opts?: Partial<EditorElement>,
): EditorElement {
  return {
    id: uuid(),
    type: "text",
    name,
    visible: true,
    x,
    y,
    text,
    fontSize,
    fontFamily: "Outfit, system-ui, sans-serif",
    fill: EDITOR_COLORS.foreground,
    align: "left",
    zIndex: opts?.zIndex ?? 10,
    ...opts,
  };
}

function accentBar(
  y: number,
  height: number,
  fill: string,
  width = 1200,
): EditorElement {
  return {
    id: uuid(),
    type: "rect",
    name: "Accent bar",
    visible: true,
    x: 0,
    y,
    width,
    height,
    fill,
    zIndex: 1,
  };
}

function qrPlaceholder(x: number, y: number, size: number): EditorElement {
  return {
    id: uuid(),
    type: "qr",
    name: "QR Code",
    bindingKey: "qrCode",
    visible: true,
    x,
    y,
    width: size,
    height: size,
    fill: EDITOR_COLORS.white,
    stroke: EDITOR_COLORS.mutedForeground,
    strokeWidth: 2,
    zIndex: 20,
  };
}

/** Default background image bundled in /public/editor/ */
const DEFAULT_BG_IMAGE_URL = "/editor/default-poster-bg.jpg";

export function calculateAspectRatioDimensions(
  type: PosterTemplateType,
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number } {
  const meta = TEMPLATE_TYPES.find((t) => t.type === type)!;
  if (!naturalWidth || !naturalHeight) {
    return { width: meta.width, height: meta.height };
  }
  const ratio = naturalWidth / naturalHeight;
  let width = meta.width;
  let height = Math.round(width / ratio);

  if (height < 400 || height > 4000) {
    height = meta.height;
    width = Math.round(height * ratio);
  }

  return {
    width: Math.max(400, Math.min(4000, width)),
    height: Math.max(400, Math.min(4000, height)),
  };
}

export function createPresetDocument(
  templateType: PosterTemplateType,
  options: CreatePresetOptions = {},
): PosterEditorDocument {
  const meta = TEMPLATE_TYPES.find((t) => t.type === templateType)!;
  const docWidth = options.width ?? meta.width;
  const docHeight = options.height ?? meta.height;
  const scheme = TEMPLATE_COLOR_SCHEMES[templateType];
  const elements: EditorElement[] = [];
  const teamCount = Math.min(20, Math.max(1, options.teamCount ?? 8));
  const useColorBg = options.withBackground !== false;

  const background: EditorBackground = options.backgroundImageUrl
    ? {
        type: "image",
        color:
          scheme.background.type === "solid"
            ? scheme.background.color
            : "#1a1a1a",
        imageUrl: options.backgroundImageUrl,
      }
    : templateType === "TEAM_POINTS"
      ? { type: "solid", color: "#ffffff" }
      : presetBackground(templateType, useColorBg);

  // When created with a custom background image, avoid placing default elements
  // so the user gets a 100% clean canvas tailored to their artwork.
  if (!options.backgroundImageUrl) {
    if (templateType === "CANDIDATE_CARD") {
      const titleFill = scheme.titleFill;
      const accentFill = scheme.accentFill;
      const bodyFill = scheme.bodyFill;
      const mutedFill = scheme.mutedFill;
      const highlightFill = scheme.highlightFill;

      elements.push(
        accentBar(0, 12, highlightFill, docWidth),
        fieldText("participantName", 56, 340, 64, {
          fontStyle: "bold",
          fill: titleFill,
          fontFamily: scheme.titleFontFamily,
        }),
        fieldText("chestNumber", 56, 420, 36, {
          text: "Chest No: 0000",
          fill: accentFill,
          fontStyle: "bold",
        }),
        fieldText("teamName", 56, 470, 36, {
          fontStyle: "bold",
          fill: bodyFill,
        }),
        fieldText("categoryName", 56, 520, 28, {
          fill: mutedFill,
        }),
        qrPlaceholder(docWidth - 290, 280, 240),
      );
    }

    if (templateType === "RESULT") {
      const pad = 96;
      let curY = 96;
      const serif = scheme.titleFontFamily;
      const sans = "Outfit, system-ui, sans-serif";

      const titleFill = scheme.titleFill;
      const accentFill = scheme.accentFill;
      const bodyFill = scheme.bodyFill;
      const mutedFill = scheme.mutedFill;
      const highlightFill = scheme.highlightFill;

      // Result Number
      const resultGroup = [
        fieldText("resultLabel", pad, curY, 22, {
          text: "RESULT NO:",
          fill: accentFill,
          fontFamily: serif,
          textCase: "upper",
        }),
        fieldText("resultNo", pad + 140, curY - 16, 48, {
          text: "34",
          fill: titleFill,
          fontStyle: "bold",
          fontFamily: sans,
        }),
      ];
      curY += 72;

      // Category
      const categoryGroup = [
        fieldText("categoryName", pad, curY, 32, {
          text: "Category A — Junior",
          fill: bodyFill,
          fontFamily: serif,
        }),
      ];
      curY += 48;

      // Programme Name
      const programmeGroup = [
        fieldText("programmeName", pad, curY, 56, {
          text: "Folk Dance (Group)",
          fontStyle: "bold",
          fill: accentFill,
          fontFamily: sans,
        }),
      ];
      curY += 96;

      const divider1 = accentBar(curY, 2, mutedFill, docWidth - pad * 2);
      divider1.x = pad;
      curY += 48;

      const winnersY = curY;
      const winnerStep = 180;

      const winnerPositionNames = [
        "🥇 FIRST PLACE",
        "🥈 SECOND PLACE",
        "🥉 THIRD PLACE",
      ];

      const winnerGroups = [];
      for (let i = 1; i <= 3; i++) {
        const wy = winnersY + (i - 1) * winnerStep;
        winnerGroups.push(
          staticText(
            `Place ${i} Label`,
            winnerPositionNames[i - 1],
            pad,
            wy,
            28,
            {
              fill: highlightFill,
              fontFamily: sans,
              fontStyle: "bold",
            },
          ),
          fieldText(`winner${i}Name`, pad, wy + 40, 40, {
            name: `Winner ${i}`,
            text: "John Doe & Party",
            fill: bodyFill,
            fontStyle: "bold",
            fontFamily: sans,
          }),
          fieldText(`winner${i}Team`, pad, wy + 90, 24, {
            name: `Place ${i} Team`,
            text: "Team Phoenix - St. Mary's HSS",
            fill: mutedFill,
            fontFamily: serif,
          }),
        );
      }

      curY = winnersY + winnerStep * 3 + 48;
      const divider2 = accentBar(curY, 2, mutedFill, docWidth - pad * 2);
      divider2.x = pad;

      elements.push(
        ...resultGroup,
        ...categoryGroup,
        ...programmeGroup,
        divider1,
        ...winnerGroups.flat(),
        divider2,
      );

      if (useColorBg) {
        elements.unshift(
          accentBar(0, 12, highlightFill, docWidth),
          accentBar(docHeight - 16, 16, accentFill, docWidth),
        );
      }
    }

    if (templateType === "CERTIFICATE") {
      const serif =
        scheme.titleFontFamily ?? '"Libre Baskerville", Georgia, serif';
      const sans = "Outfit, system-ui, sans-serif";
      const titleFill = scheme.titleFill;
      const accentFill = scheme.accentFill;
      const bodyFill = scheme.bodyFill;
      const mutedFill = scheme.mutedFill;
      const highlightFill = scheme.highlightFill;

      elements.push(
        {
          id: uuid(),
          type: "rect",
          name: "Certificate Border",
          visible: true,
          x: 60,
          y: 60,
          width: docWidth - 120,
          height: docHeight - 120,
          fill: "transparent",
          stroke: accentFill,
          strokeWidth: 4,
          zIndex: 1,
        },
        fieldText("certificateTitle", 100, 200, 68, {
          name: "Certificate Title",
          text: "Certificate of Participation",
          fontStyle: "bold",
          fontFamily: serif,
          fill: titleFill,
          align: "center",
          width: docWidth - 200,
        }),
        staticText(
          "Presentation Subtitle",
          "THIS IS PROUDLY PRESENTED TO",
          100,
          310,
          22,
          {
            fill: mutedFill,
            align: "center",
            width: docWidth - 200,
            fontFamily: sans,
            letterSpacing: 3,
          },
        ),
        fieldText("participantName", 100, 390, 72, {
          name: "Participant Name",
          text: "Candidate Name",
          fontStyle: "bold",
          fontFamily: serif,
          fill: bodyFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("teamName", 100, 490, 30, {
          name: "Team Name",
          text: "House Blue",
          fontStyle: "bold",
          fill: accentFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("programmeName", 100, 570, 38, {
          name: "Programme Name",
          text: "Folk Dance (Group)",
          fontStyle: "bold",
          fontFamily: sans,
          fill: bodyFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("categoryName", 100, 640, 26, {
          name: "Category Name",
          text: "Category A — Junior",
          fill: mutedFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("resultLabel", 100, 700, 34, {
          name: "Result Label",
          text: "1st Prize",
          fontStyle: "bold",
          fill: highlightFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("festName", 100, 800, 28, {
          name: "Festival Name",
          text: "Greenroom Arts Fest 2026",
          fontStyle: "bold",
          fill: bodyFill,
          align: "center",
          width: docWidth - 200,
        }),
        fieldText("festDate", 100, 845, 20, {
          name: "Festival Date",
          text: "21 May 2026",
          fill: mutedFill,
          align: "center",
          width: docWidth - 200,
        }),
        staticText("Left Sig Line", "______________________", 250, 1080, 22, {
          fill: mutedFill,
          align: "center",
          width: 400,
        }),
        staticText("Left Sig Label", "Festival Convener", 250, 1115, 18, {
          fill: bodyFill,
          fontStyle: "bold",
          align: "center",
          width: 400,
        }),
        staticText(
          "Right Sig Line",
          "______________________",
          docWidth - 650,
          1080,
          22,
          {
            fill: mutedFill,
            align: "center",
            width: 400,
          },
        ),
        staticText(
          "Right Sig Label",
          "General Secretary",
          docWidth - 650,
          1115,
          18,
          {
            fill: bodyFill,
            fontStyle: "bold",
            align: "center",
            width: 400,
          },
        ),
      );
    }

    if (templateType === "TEAM_POINTS") {
      const marginX = 80;
      const contentWidth = docWidth - marginX * 2;
      const teamColX = marginX + 40;
      const teamColWidth = 640;
      const scoreColX = docWidth - marginX - 220;
      const scoreColWidth = 220;
      const titleY = 72;
      const festY = 168;
      const rowAreaTop = 280;
      const rowAreaBottom = docHeight - 80;
      const rowAreaHeight = rowAreaBottom - rowAreaTop;
      const rowHeight = Math.max(
        48,
        Math.min(76, Math.floor(rowAreaHeight / teamCount)),
      );
      const rowsBlockHeight = teamCount * rowHeight;
      const rowStartY =
        rowAreaTop + Math.floor((rowAreaHeight - rowsBlockHeight) / 2);

      elements.push(
        staticText("Section title", "After 10 Results", marginX, titleY, 48, {
          fill: scheme.titleFill,
          fontFamily: scheme.titleFontFamily,
          fontStyle: "bold",
          align: "center",
          width: contentWidth,
        }),
        fieldText("festName", marginX, festY, 28, {
          fontStyle: "bold",
          fill: scheme.mutedFill,
          align: "center",
          width: contentWidth,
        }),
        fieldText("festDate", marginX, festY + 36, 20, {
          fill: scheme.mutedFill,
          align: "center",
          width: contentWidth,
        }),
      );

      for (let i = 0; i < teamCount; i++) {
        const y = rowStartY + i * rowHeight;
        elements.push(
          fieldText(`team${i + 1}Name`, teamColX, y, 36, {
            name: `Team ${i + 1}`,
            text: `Team ${i + 1}`,
            fill: scheme.bodyFill,
            fontStyle: "bold",
            align: "left",
            width: teamColWidth,
          }),
          fieldText(`team${i + 1}Points`, scoreColX, y, 36, {
            name: `Points ${i + 1}`,
            text: "0",
            fill: scheme.accentFill,
            fontStyle: "bold",
            align: "right",
            width: scoreColWidth,
          }),
        );
      }
    }
  }

  return {
    templateType,
    width: docWidth,
    height: docHeight,
    background,
    elements,
    customFonts: [],
    createOptions: options,
    updatedAt: new Date().toISOString(),
  };
}
