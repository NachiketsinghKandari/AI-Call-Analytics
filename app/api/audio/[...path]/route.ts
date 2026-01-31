import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Allowed audio directories (relative to project root)
const AUDIO_DIRS: Record<string, string> = {
  'mccraw': 'McCrawLaw-Calls',
  'bey': 'Bey & Associates - Calls',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // First segment is the source identifier (mccraw or bey)
    const [source, ...restPath] = pathSegments;
    const filePath = restPath.join('/');

    // Security: Only allow .mp3 files
    if (!filePath.endsWith('.mp3')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate source
    const audioDir = AUDIO_DIRS[source];
    if (!audioDir) {
      return NextResponse.json({ error: 'Invalid audio source' }, { status: 400 });
    }

    // Prevent path traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Construct full path
    const fullPath = path.join(process.cwd(), audioDir, normalizedPath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file stats for Content-Length
    const stats = await fs.stat(fullPath);
    const fileSize = stats.size;

    // Handle range requests for seeking
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileHandle = await fs.open(fullPath, 'r');
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Full file request
    const fileBuffer = await fs.readFile(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
