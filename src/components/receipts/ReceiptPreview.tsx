import { Card } from "@/components/ui/card";
import { FileText, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ReceiptPreviewProps {
  previewUrl: string | null;
  file: File | null;
  onExpand: () => void;
}

export function ReceiptPreview({ previewUrl, file, onExpand }: ReceiptPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(100);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Ralentir le défilement en appliquant un facteur de 0.3
      const newPosition = 100 + scrollY * 0.01;
      
      // Limiter la position à une valeur maximale pour éviter de descendre trop bas
      const maxPosition = window.innerHeight - 300;
      setPosition(Math.min(maxPosition, Math.max(100, newPosition)));
    };
    
    // Initialiser la position
    handleScroll();
    
    // Ajouter l'écouteur d'événements
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    
    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (!previewUrl || !file) return null;

  return (
    <div className="hidden xl:block xl:w-1/4" ref={containerRef}>
      <div 
        style={{ 
          position: 'fixed',
          top: `${position}px`,
          right: '3%',
          width: 'calc(22% - 2rem)', // Légèrement réduit pour éviter le chevauchement
          maxHeight: 'calc(70vh)',
          zIndex: 1 // Réduction du z-index pour ne pas superposer des éléments importants
        }}
      >
        <Card className="p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Aperçu</h3>
            <button
              onClick={onExpand}
              className="text-gray-500 hover:text-gray-700"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-md">
            {file.type.includes('image') ? (
              <img 
                src={previewUrl} 
                alt="Aperçu du ticket" 
                className="object-contain w-full h-full"
              />
            ) : file.type === 'application/pdf' ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-md">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">
                    Le PDF ne peut pas être affiché. 
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Ouvrir dans un nouvel onglet
                    </a>
                  </p>
                </div>
              </object>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-md">
                <FileText className="h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Aperçu non disponible</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 