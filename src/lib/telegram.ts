// Un solo POST al endpoint sendMessage de la Bot API — devuelve {ok, error}
// en vez de tirar, para poder reusarla tanto en un aviso automático como en
// el botón "Probar" del admin.
export async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (res.ok) return { ok: true };

    // Telegram devuelve { description } con el motivo (token inválido, chat
    // no encontrado, bot sin permiso, etc.) — útil para mostrar en el admin.
    const detail = await res.text().catch(() => "");
    let description = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(detail) as { description?: string };
      if (parsed.description) description = parsed.description;
    } catch {
      /* dejamos el HTTP status */
    }
    return { ok: false, error: description };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red" };
  }
}
