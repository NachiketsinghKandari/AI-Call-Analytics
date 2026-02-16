import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try multiple paths for compatibility
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'mccraw-data.json'),
      path.join(process.cwd(), '.next', 'server', 'app', 'mccraw-data.json'),
      path.join(process.cwd(), 'mccraw-data.json'),
    ];

    let data = null;
    for (const dataPath of possiblePaths) {
      try {
        const fileContent = await fs.readFile(dataPath, 'utf-8');
        data = JSON.parse(fileContent);
        break;
      } catch {
        // Try next path
      }
    }

    if (data) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    // Fallback: return empty data
    console.warn('Firm 2 data not found in any expected location');
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'Firm 2 data not found',
    }, { status: 404 });
  } catch (err) {
    console.error('Error loading Firm 2 data:', err);
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'Failed to load Firm 2 data',
    }, { status: 500 });
  }
}
