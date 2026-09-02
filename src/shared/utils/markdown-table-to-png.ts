import { readFileSync } from 'node:fs';
import React from 'react';
import satori from 'satori';
import sharp from 'sharp';

export interface ParsedMarkdownTable {
  headers: string[];
  rows: string[][];
}

const parseTableRow = (line: string): string[] => {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/^`|`$/g, '').replace(/\\`/g, '`'));

  return cells.filter((cell) => cell.length > 0 || cells.length > 1);
};

const isSeparatorCell = (cell: string): boolean => /^:?-{3,}:?$/.test(cell.trim());

export const parseMarkdownTable = (markdown: string): ParsedMarkdownTable => {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    throw new Error('Markdown table must include a header row, separator row, and at least one data row.');
  }

  const headers = parseTableRow(lines[0]!);
  const separatorCells = parseTableRow(lines[1]!);

  if (headers.length === 0 || separatorCells.length !== headers.length || !separatorCells.every(isSeparatorCell)) {
    throw new Error('Invalid Markdown table format.');
  }

  const rows = lines
    .slice(2)
    .map((line) => parseTableRow(line))
    .filter((cells) => cells.length === headers.length);

  return { headers, rows };
};

const getFontData = (): Buffer => {
  const fontPath = require.resolve('@fontsource/inter/files/inter-latin-400-normal.woff');
  return readFileSync(fontPath);
};

const getBoldFontData = (): Buffer => {
  const fontPath = require.resolve('@fontsource/inter/files/inter-latin-700-normal.woff');
  return readFileSync(fontPath);
};

const escapeText = (value: string): string => value.replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'));

const formatCellValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const numeric = Number(trimmed.replace(/,/g, ''));
  if (Number.isFinite(numeric) && /\./.test(trimmed)) {
    return numeric.toFixed(1);
  }

  return trimmed;
};

export async function markdownTableToPng(
  markdown: string,
  options: {
    width?: number;
    padding?: number;
  } = {}
): Promise<Buffer> {
  const { headers, rows } = parseMarkdownTable(markdown);

  const padding = options.padding ?? 18;
  const baseWidth = options.width ?? Math.max(720, headers.length * 220 + 120);
  const width = Math.min(baseWidth, 1400);

  const estimatedHeight = 52 + (rows.length + 1) * 32 + padding * 2;
  const height = Math.min(Math.max(estimatedHeight, 160), 1600);

  const font = getFontData();
  const boldFont = getBoldFontData();

  const svg = await satori(
    React.createElement(
      'div',
      {
        style: {
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#111827',
          color: '#f9fafb',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.32)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: `${padding}px`,
            background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              color: '#e2e8f0',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            },
          },
          'Markdown Table'
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                width: '100%',
                backgroundColor: '#1e293b',
                borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
              },
            },
            ...headers.map((header, index) =>
              React.createElement(
                'div',
                {
                  key: `header-${index}`,
                  style: {
                    flex: '1 1 0',
                    minWidth: '120px',
                    padding: '12px 10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#f8fafc',
                    textAlign: 'left',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    borderRight: index === headers.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
                  },
                },
                escapeText(header)
              )
            )
          ),
          ...rows.map((row, rowIndex) =>
            React.createElement(
              'div',
              {
                key: `row-${rowIndex}`,
                style: {
                  display: 'flex',
                  width: '100%',
                  backgroundColor: rowIndex % 2 === 0 ? '#0f172a' : '#111827',
                  borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.18)',
                },
              },
              ...row.map((cell, cellIndex) =>
                React.createElement(
                  'div',
                  {
                    key: `cell-${rowIndex}-${cellIndex}`,
                    style: {
                      flex: '1 1 0',
                      minWidth: '120px',
                      padding: '10px 10px',
                      fontSize: '12px',
                      color: '#e2e8f0',
                      lineHeight: 1.3,
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      borderRight: cellIndex === row.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.12)',
                    },
                  },
                  escapeText(formatCellValue(cell))
                )
              )
            )
          )
        )
      )
    ),
    {
      width,
      height,
      fonts: [
        { name: 'Inter', data: font, weight: 400, style: 'normal' },
        { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();
  return png;
}
