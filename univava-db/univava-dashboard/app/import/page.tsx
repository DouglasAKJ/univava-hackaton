"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
  ExternalLink,
  Loader2,
  FileCheck,
  HelpCircle,
} from "lucide-react";

export default function ImportMatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(selectedFile: File) {
    if (!selectedFile.name.endsWith(".json")) {
      setError("Por favor, selecione um arquivo no formato .json");
      setFile(null);
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/matches/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao processar o arquivo.");
      }

      setResult(data.result);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao importar a partida.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a lista de partidas
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <UploadCloud className="w-8 h-8 text-rose-500" />
          Importar Nova Partida
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Faça o upload do arquivo JSON de uma partida da Riot Games para incluí-la no banco de dados e atualizar as estatísticas do torneio.
        </p>
      </div>

      {/* Instructions Card: Naming pattern & Fallback */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Instruções sobre o Nome do Arquivo</span>
        </div>

        {/* Standard pattern */}
        <div className="space-y-2 text-xs text-zinc-300">
          <p className="leading-relaxed">
            Para que os nomes das equipes, etapa do torneio e placares sejam reconhecidos com 100% de precisão, recomendamos nomear o arquivo seguindo o padrão oficial:
          </p>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-amber-300 break-all select-all">
            UNIVAVA_&#123;ETAPA&#125;_&#123;CODIGO&#125;_&#123;DD-MM-AA&#125;_&#123;TIME_A&#125;_&#123;PLACAR_A&#125;_x_&#123;PLACAR_B&#125;_&#123;TIME_B&#125;_&#123;MAPA&#125;.json
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">Exemplo real:</div>
            <code className="text-emerald-400 block font-mono">
              UNIVAVA_C4_118_13-09-26_ufpr_bbn_3_x_13_fei_darkowls_ascent.json
            </code>
          </div>
        </div>

        {/* Fallback Notice */}
        <div className="flex items-start gap-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 text-xs text-cyan-200">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-cyan-300 block">
              Seu arquivo tem um nome genérico (ex: match.json)?
            </span>
            <p className="text-cyan-200/80 leading-relaxed text-[11px]">
              Não se preocupe! O sistema possui <strong>fallback automático</strong>. Se o nome não seguir o padrão acima, nós extrairemos diretamente de dentro do JSON o mapa, duração, placares, abates e data, definindo as equipes como <em>Time Vermelho</em> e <em>Time Azul</em>.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelected(e.target.files[0]);
            }
          }}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-950/40 hover:bg-zinc-950/80"
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-zinc-300">
            <FileCode className="w-8 h-8 text-rose-400" />
          </div>

          <h3 className="text-base font-bold text-white">
            {file ? file.name : "Clique ou arraste o arquivo JSON da partida aqui"}
          </h3>

          <p className="text-xs text-zinc-400 mt-1">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB • Pronto para processamento`
              : "Suporta arquivos .json gerados pela API de partidas de Valorant"}
          </p>
        </div>

        {/* Selected File Details & Upload Action */}
        {file && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {file.name}
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50 text-white text-sm font-bold transition-all shadow-lg shadow-rose-950/50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Confirmar Importação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl p-4 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block mb-0.5">Falha na importação</span>
              <p className="text-red-200/90">{error}</p>
            </div>
          </div>
        )}

        {/* Success Card */}
        {result && (
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Partida importada com sucesso para o banco de dados!</span>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Confronto:</span>
                <span className="font-bold text-white">
                  {result.teamA} ({result.scoreA}) x ({result.scoreB}) {result.teamB}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Mapa:</span>
                <span className="text-amber-300">{result.mapName}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Slug / ID:</span>
                <span className="text-zinc-400 truncate max-w-xs">{result.slug}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Importar outra partida
              </button>

              <Link
                href={`/matches/${result.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50"
              >
                <span>Ver detalhes da partida</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
