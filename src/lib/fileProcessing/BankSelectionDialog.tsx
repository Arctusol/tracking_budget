import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface BankSelectionProps {
  open: boolean;
  onClose: () => void;
  onBankSelect: (bankType: string) => void;
  fileName: string;
}

const BankSelectionDialog: React.FC<BankSelectionProps> = ({ open, onClose, onBankSelect, fileName }) => {
  const [selectedBank, setSelectedBank] = useState<string>('auto');

  const handleSubmit = () => {
    console.log("Sélection soumise:", selectedBank);
    onBankSelect(selectedBank);
  };

  // Une fonction pour gérer la fermeture qui réinitialise le composant
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader>
        <DialogTitle>Sélection de la banque</DialogTitle>
        <DialogDescription>
          Veuillez sélectionner la banque correspondant au relevé: <strong>{fileName}</strong>
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <RadioGroup
          value={selectedBank}
          onValueChange={setSelectedBank}
          className="space-y-4 my-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="auto" />
            <Label htmlFor="auto">Détection automatique</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fortuneo" id="fortuneo" />
            <Label htmlFor="fortuneo">Fortuneo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boursobank" id="boursobank" />
            <Label htmlFor="boursobank">Boursobank / Boursorama Banque</Label>
          </div>
        </RadioGroup>
      </DialogContent>
      <DialogFooter className="flex space-x-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="default" onClick={handleSubmit}>
          Analyser
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default BankSelectionDialog; 