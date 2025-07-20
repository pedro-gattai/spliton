import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Upload } from 'lucide-react';

interface ReceiptUploadProps {
  onUpload: (file: File | null) => void;
  preview?: string | null;
  maxSize?: string;
  acceptedTypes?: string[];
}

export const ReceiptUpload = ({ 
  onUpload, 
  preview, 
  maxSize = "5MB",
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: ReceiptUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Verificar tipo
    if (!acceptedTypes.includes(file.type)) {
      setError(`Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`);
      return false;
    }

    // Verificar tamanho (5MB = 5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onUpload(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    onUpload(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="space-y-2">
          <div className="relative">
            <img 
              src={preview} 
              alt="Recibo" 
              className="max-h-40 w-full object-contain rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Clique no X para remover a imagem
          </p>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-3">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Clique para adicionar ou arraste uma foto
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou WebP • Máximo {maxSize}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Escolher Arquivo
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}; 