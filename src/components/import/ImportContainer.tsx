import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import ProcessingPreview from './ProcessingPreview';
import { processFile, ProcessedTransaction } from '@/lib/fileProcessing';
import { BankStatement } from '@/types/bankStatement';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { useToast } from "@/components/ui/use-toast";

export default function ImportContainer() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string>('');
    const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
    const [currentStatement, setCurrentStatement] = useState<BankStatement | null>(null);
    const { toast } = useToast();

    const generateUniqueId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const handleFileSelect = async (files: File[]) => {
        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            // Traiter chaque fichier
            for (const file of files) {
                setProgress(10);

                // Traiter le fichier
                const result = await processFile(file);
                setProgress(70);

                // Ajouter des IDs uniques aux transactions
                const processedTransactions = result.map(transaction => ({
                    ...transaction,
                    id: generateUniqueId()
                }));

                // Mettre à jour les transactions
                setTransactions(processedTransactions);
                setProgress(100);

                toast({
                    title: "Fichier traité avec succès",
                    description: `${processedTransactions.length} transactions ont été extraites.`,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du traitement du fichier');
            toast({
                variant: "destructive",
                title: "Erreur",
                description: err instanceof Error ? err.message : 'Une erreur est survenue lors du traitement du fichier',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        try {
            // Ici, vous pouvez ajouter la logique pour sauvegarder les transactions
            toast({
                title: "Import réussi",
                description: "Les transactions ont été importées avec succès.",
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Erreur lors de la sauvegarde des transactions.",
            });
        }
    };

    const handleCancel = () => {
        setTransactions([]);
        setCurrentStatement(null);
        setError('');
    };

    const handleCategoryChange = (transactionId: string, category: string) => {
        setTransactions(prev =>
            prev.map(t =>
                t.id === transactionId ? { ...t, category } : t
            )
        );
    };

    return (
        <div className="space-y-6">
            {transactions.length === 0 ? (
                <FileUploadZone
                    onFileSelect={handleFileSelect}
                    isUploading={isProcessing}
                    uploadProgress={progress}
                    error={error}
                    acceptedFileTypes={['.pdf', '.csv']}
                />
            ) : (
                <ProcessingPreview
                    isProcessing={isProcessing}
                    progress={progress}
                    error={error}
                    transactions={transactions}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onCategoryChange={handleCategoryChange}
                />
            )}
        </div>
    );
}
