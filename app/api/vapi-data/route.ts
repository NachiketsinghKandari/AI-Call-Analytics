import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // On Vercel, files in public are copied to the output directory
    // Try multiple paths for compatibility
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'vapi-data.json'),
      path.join(process.cwd(), '.next', 'server', 'app', 'vapi-data.json'),
      path.join(process.cwd(), 'vapi-data.json'),
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
    console.warn('VAPI data not found in any expected location');
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'VAPI data not found',
    }, { status: 404 });
  } catch (err) {
    console.error('Error loading VAPI data:', err);
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'Failed to load VAPI data',
    }, { status: 500 });
  }
}
