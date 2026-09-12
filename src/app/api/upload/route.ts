import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { base64Data, fileName = `screenshot-${Date.now()}.png`, mimeType = 'image/png' } = body;

      if (!base64Data) {
        return NextResponse.json({ error: 'base64Data is required' }, { status: 400 });
      }

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeFileName);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        fileUrl: `/uploads/${safeFileName}`,
        fileName: safeFileName,
        mimeType,
        size: buffer.length,
      });
    }

    // Handle Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      fileUrl: `/uploads/${safeFileName}`,
      fileName: safeFileName,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
