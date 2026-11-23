import { NextResponse } from "next/server";
import { store, getCheck, addAudit } from "@/lib/store";

const MAX_FILES = 20;
const MAX_SIZE_MB = 20;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Хамгийн ихдээ ${MAX_FILES} файл оруулж болно` },
      { status: 400 }
    );
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Нийт хэмжээ ${MAX_SIZE_MB} MB-аас хэтрэхгүй байх ёстой` },
      { status: 400 }
    );
  }

  const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];
  for (const file of files) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: `Зөвшөөрөгдөхгүй файл: ${ext || "төрөгүй"}` },
        { status: 400 }
      );
    }
  }

  check.pages = files.length;
  addAudit("usr_demo", "citizen", "files_uploaded", "check", id);

  return NextResponse.json({
    success: true,
    files: files.map((f, i) => ({
      id: `file_${i}_${Date.now().toString(36)}`,
      name: f.name,
      size: f.size,
      order: i,
    })),
  });
}
