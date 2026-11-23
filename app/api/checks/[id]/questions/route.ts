import { NextResponse } from "next/server";
import { store, getCheck, getQuestions, nextId, addAudit } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(getQuestions(id));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const body = await req.json();
  const text = (body.body ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Асуултын текст шаардлагатай" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "Асуулт 1000 тэмдэгтээс урт байж болохгүй" }, { status: 400 });
  }

  // Spec: citizen may ask the lawyer one follow-up question after delivery
  const citizenQuestions = getQuestions(id).filter((q) => q.from === "citizen");
  if (citizenQuestions.length >= 1) {
    return NextResponse.json(
      { error: "Хуульчаас нэмэлт асуулт асуух эрх таныг ашигласан байна" },
      { status: 429 }
    );
  }

  const question = {
    id: nextId("q"),
    checkId: id,
    from: "citizen" as const,
    body: text,
    at: new Date().toISOString(),
  };

  store.questions.push(question);
  addAudit("usr_demo", "citizen", "question_asked", "question", question.id);

  return NextResponse.json(question, { status: 201 });
}
