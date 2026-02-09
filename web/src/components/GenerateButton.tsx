"use client";

import { Loader2, Sparkles } from "lucide-react";

interface GenerateButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

const GenerateButton = ({ disabled, loading, onClick }: GenerateButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full h-14 rounded-2xl font-semibold text-base
        transition-all duration-300 flex items-center justify-center gap-2
        ${disabled
          ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
          : "gradient-button text-primary-foreground hover:scale-[1.02] hover:shadow-[0_0_40px_hsl(180_100%_27%/0.3)] active:scale-[0.98]"
        }
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          Generate Calendar File
        </>
      )}
    </button>
  );
};

export default GenerateButton;
