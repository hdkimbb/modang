import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN이 없어요. Vercel Blob을 생성한 뒤 .env.local에 토큰을 추가해 주세요.",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "파일이 없어요." }, { status: 400 });
  }

  const filename =
    file instanceof File && file.name ? file.name : `upload-${Date.now()}.jpg`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[Upload Error]", error);
    return NextResponse.json(
      {
        error: "이미지 업로드에 실패했어요",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
