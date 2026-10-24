import { NextRequest, NextResponse } from "next/server";
import { importMatch } from "@/lib/importer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado. Selecione um arquivo JSON." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { success: false, error: "Formato inválido. Apenas arquivos .json são aceitos." },
        { status: 400 }
      );
    }

    const text = await file.text();
    let jsonData: any;

    try {
      jsonData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: "O arquivo enviado não é um JSON válido." },
        { status: 400 }
      );
    }

    const result = importMatch(jsonData, file.name);

    return NextResponse.json({
      success: true,
      result,
      message: result.isExisting
        ? "Partida atualizada com sucesso!"
        : "Partida importada com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro na importação da partida:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro inesperado ao processar o arquivo da partida.",
      },
      { status: 500 }
    );
  }
}
