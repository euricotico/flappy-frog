import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FEF9C3] px-3.5 py-2 text-xs font-semibold text-[#143326] shadow-[0_3px_0_#143326]"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Modo offline · Jogo funcionando sem internet</span>
    </div>
  );
};

interface PWAInstallControlProps {
  variant?: 'prominent' | 'compact';
}

export const PWAInstallControl: React.FC<PWAInstallControlProps> = ({
  variant = 'prominent',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  return (
    <>
      {variant === 'prominent' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FFFDF2] px-5 py-2.5 text-sm font-bold text-[#143326] whitespace-nowrap shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF9C3] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>{isInstallable ? 'Instalar no Android' : 'Instalar no Celular / APK'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Instalar aplicativo no celular"
          className="pointer-events-auto inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-[#143326] bg-[#FEF9C3] px-3 text-xs font-bold text-[#143326] whitespace-nowrap shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF08A] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Instalar</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F291E]/60 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md rounded-3xl border-[3px] border-[#143326] bg-[#FFFDF2] p-6 text-left shadow-[0_8px_0_#143326]">
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              aria-label="Fechar guia de instalação"
              className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#143326]/20 bg-emerald-50 text-[#143326] hover:bg-emerald-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display pr-10 text-2xl font-bold text-[#143326]">
              Instalar no Android
            </h3>
            <p className="mt-1.5 text-sm text-emerald-950/80">
              O Sapinho Voador já está configurado como aplicativo instalável (PWA) com modo offline e pronto para empacotar em APK.
            </p>

            {isIOS ? (
              <div className="mt-4 space-y-2 border-y border-[#143326]/12 py-4 text-sm text-emerald-950">
                <p className="font-bold">No iPhone / iPad (Safari):</p>
                <p>1. Toque no botão <strong>Compartilhar</strong> na barra inferior.</p>
                <p>2. Selecione <strong>Adicionar à Tela de Início</strong> e confirme.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 border-y border-[#143326]/12 py-4 text-sm text-emerald-950">
                <div>
                  <p className="font-bold">Opção 1 — Instalar direto pelo Chrome (WebAPK):</p>
                  <p className="mt-1 text-emerald-950/80">
                    1. Abra o link compartilhado deste jogo no <strong>Google Chrome</strong> do seu Android.
                  </p>
                  <p className="text-emerald-950/80">
                    2. Toque no menu <strong>⋮</strong> (três pontinhos) e escolha <strong>Instalar aplicativo</strong>.
                  </p>
                  <p className="text-emerald-950/80">
                    3. O Android cria o ícone do Sapinho na tela inicial em tela cheia e funcionando offline.
                  </p>
                </div>

                <div className="pt-1">
                  <p className="font-bold">Opção 2 — Gerar arquivo .APK no PWABuilder:</p>
                  <p className="mt-1 text-emerald-950/80">
                    O link da aba <strong>Share</strong> exige login Google, por isso o PWABuilder não consegue ler o manifest dele. Para gerar o <strong>.APK</strong>, primeiro publique o app em uma URL pública sem login (usando <strong>Deploy</strong> ou arrastando a pasta <code>dist</code> no <strong>Netlify Drop</strong>) e cole essa URL pública no <strong>pwabuilder.com</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#143326] whitespace-nowrap shadow-[0_3px_0_#143326] hover:bg-[#FDE047] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Link copiado!' : 'Copiar link do jogo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#143326]/25 bg-emerald-50 px-5 py-2 text-sm font-semibold text-[#143326] whitespace-nowrap hover:bg-emerald-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
