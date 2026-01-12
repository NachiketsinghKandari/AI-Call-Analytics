import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // On Vercel, files in public are copied to the output directory
    // Try multiple paths for compatibility
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'sample-data.json'),
      path.join(process.cwd(), '.next', 'server', 'app', 'sample-data.json'),
      path.join(process.cwd(), 'sample-data.json'),
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
      return NextResponse.json(data);
    }

    // Fallback: return empty data
    console.warn('Sample data not found in any expected location');
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'Sample data not found',
    }, { status: 404 });
  } catch (err) {
    console.error('Error loading sample data:', err);
    return NextResponse.json({
      files: [],
      stats: null,
      error: 'Failed to load sample data',
    }, { status: 500 });
  }
}
