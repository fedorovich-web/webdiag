import { NextResponse } from "next/server";
import { sendContactEmailViaNevtan } from "../../../src/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, topic, message } = body ?? {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Укажите ваше имя" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ ok: false, error: "Укажите корректный email" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Введите текст сообщения" }, { status: 400 });
    }

    const result = await sendContactEmailViaNevtan({
      name: name.trim().slice(0, 200),
      email: email.trim().toLowerCase().slice(0, 200),
      topic: typeof topic === "string" ? topic.trim().slice(0, 200) : "Обращение с сайта",
      message: message.trim().slice(0, 4000),
    });

    if (!result.success && result.error) {
      // Return 500 only if there was an explicit unexpected failure
      return NextResponse.json({ ok: false, error: "Не удалось отправить сообщение. Пожалуйста, напишите нам напрямую на support@webdiag.ru" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Сообщение успешно отправлено" });
  } catch (err: unknown) {
    console.error("[/api/contact error]", err);
    return NextResponse.json({ ok: false, error: "Произошла ошибка при обработке запроса" }, { status: 500 });
  }
}
