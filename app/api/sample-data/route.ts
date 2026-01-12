import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'public', 'sample-data.json');

  // Check if pre-computed sample data exists
  if (fs.existsSync(dataPath)) {
    try {
      const data = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error('Error reading pre-computed sample data:', err);
    }
  }

  // Fallback: return empty data with message
  console.warn('Pre-computed sample data not found. Run: npm run generate-sample');
  return NextResponse.json({
    files: [],
    stats: null,
    error: 'Sample data not generated. Run: npm run generate-sample',
  });
}
