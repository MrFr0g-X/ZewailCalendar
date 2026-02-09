"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";

interface FileUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  fileName: string | null;
  onClear: () => void;
}

const FileUpload = ({ onFileLoaded, fileName, onClear }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) onFileLoaded(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (fileName) {
    return (
      <LiquidGlass intensity="sm" animate className="liquid-glass-interactive">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">Uploaded successfully</p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </LiquidGlass>
    );
  }

  return (
    <LiquidGlass
      intensity="md"
      className={`liquid-glass-interactive cursor-pointer transition-all duration-300 ${
        isDragging ? "scale-[1.02]" : ""
      }`}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          p-10 text-center rounded-[1.5rem]
          border-2 border-dashed transition-all duration-300
          ${isDragging
            ? "border-primary/60 bg-primary/5"
            : "border-border/30 hover:border-primary/30"
          }
        `}
      >
        <label className="cursor-pointer flex flex-col items-center gap-4">
          <div
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isDragging ? "bg-primary/20 animate-pulse-glow" : "bg-muted/20"}
            `}
          >
            <Upload className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">
              Drop your schedule file here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse · accepts <span className="text-primary">.html</span> files
            </p>
          </div>
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>
    </LiquidGlass>
  );
};

export default FileUpload;
