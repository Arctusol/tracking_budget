import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CATEGORY_NAMES, getParentCategory } from "@/lib/constants/constants";
import { MonthlyBudget } from "@/types/budget";
import { Transaction } from "@/types/transaction";
import { useBudgetAnalysis } from "@/hooks/useBudgetAnalysis";
import { formatCurrency } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { BudgetComparison } from "./BudgetComparison";
import { ExportButton } from "@/components/common/ExportButton";

interface BudgetPlannerProps {
  transactions: Transaction[];
}

export function BudgetPlanner({ transactions }: BudgetPlannerProps) {
  const { budgetAnalysis, currentBudget, setCurrentBudget } = useBudgetAnalysis(transactions);

  if (!currentBudget) {
    return null;
  }

  const handleAdjustmentChange = (categoryId: string, value: string) => {
    if (!currentBudget) return;

    const numericValue = parseFloat(value) || 0;
    const updatedCategories = { ...currentBudget.categories };

    // Trouver la catégorie principale et la sous-catégorie
    Object.entries(updatedCategories).forEach(([mainCategory, categoryData]) => {
      if (categoryId in categoryData.subCategories) {
        const subCategories = { ...categoryData.subCategories };
        subCategories[categoryId] = {
          ...subCategories[categoryId],
          adjustedAmount: numericValue
        };

        // Recalculer le total ajusté de la catégorie principale
        const totalAdjusted = Object.values(subCategories).reduce(
          (sum, sub) => sum + (sub.adjustedAmount ?? sub.estimatedAmount),
          0
        );

        updatedCategories[mainCategory] = {
          ...categoryData,
          subCategories,
          totalAdjusted
        };
      }
    });

    // Recalculer le total général ajusté
    const totalAdjusted = Object.values(updatedCategories).reduce(
      (sum, category) => sum + (category.totalAdjusted ?? category.totalEstimated),
      0
    );

    setCurrentBudget({
      ...currentBudget,
      categories: updatedCategories,
      totalAdjusted
    });
  };

  // Filtrer les catégories sans transactions et sans budget
  const filteredCategories = Object.entries(currentBudget.categories)
    .filter(([categoryId, category]) => {
      const hasTransactions = transactions.some(t => 
        t.category_id === categoryId || 
        getParentCategory(t.category_id) === categoryId
      );
      const hasEstimatedAmount = Object.values(category.subCategories)
        .some(sub => sub.estimatedAmount > 0);
      const hasAdjustedAmount = Object.values(category.subCategories)
        .some(sub => (sub.adjustedAmount ?? 0) > 0);
      
      return hasTransactions || hasEstimatedAmount || hasAdjustedAmount;
    })
    .reduce((acc, [categoryId, category]) => {
      acc[categoryId] = {
        ...category,
        subCategories: Object.entries(category.subCategories)
          .filter(([subCatId, subCat]) => {
            const hasTransactions = transactions.some(t => t.category_id === subCatId);
            return hasTransactions || subCat.estimatedAmount > 0 || (subCat.adjustedAmount ?? 0) > 0;
          })
          .reduce((subAcc, [subCatId, subCat]) => {
            subAcc[subCatId] = subCat;
            return subAcc;
          }, {} as typeof category.subCategories)
      };
      return acc;
    }, {} as typeof currentBudget.categories);

  const displayBudget = {
    ...currentBudget,
    categories: filteredCategories
  };

  const currentDate = new Date();
  const previousMonth = format(subMonths(currentDate, 1), 'MMMM yyyy');
  const startHistoricalPeriod = format(subMonths(currentDate, 6), 'MMMM yyyy');
  const endHistoricalPeriod = format(subMonths(currentDate, 1), 'MMMM yyyy');

  const formatVariation = (current: number, reference: number) => {
    // Si les deux valeurs sont 0, pas de variation
    if (current === 0 && reference === 0) {
      return null;
    }
    
    // Si la référence est 0 mais le montant actuel non nul, c'est une nouvelle dépense
    if (reference === 0 && current > 0) {
      return (
        <span className="text-red-500">
          Nouvelle dépense
          <span className="text-xs ml-1 text-gray-500">
            ({formatCurrency(current)})
          </span>
        </span>
      );
    }

    // Si le montant actuel est 0 mais la référence non nulle, c'est une diminution de 100%
    if (current === 0 && reference > 0) {
      return (
        <span className="text-green-500">
          -100%
          <span className="text-xs ml-1 text-gray-500">
            (-{formatCurrency(reference)})
          </span>
        </span>
      );
    }

    // Calcul normal de la variation
    const variation = ((current - reference) / reference) * 100;
    return (
      <span className={variation > 0 ? "text-red-500" : "text-green-500"}>
        {`${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`}
        <span className="text-xs ml-1 text-gray-500">
          ({formatCurrency(current - reference)})
        </span>
      </span>
    );
  };

  const prepareExportData = () => {
    return Object.entries(displayBudget.categories).flatMap(([mainCategory, category]) => {
      const mainCategoryRow = {
        Catégorie: CATEGORY_NAMES[mainCategory],
        "Moyenne 6 mois": Object.values(category.subCategories).reduce((sum, sub) => sum + sub.average6Months, 0),
        "Moyenne 3 mois": Object.values(category.subCategories).reduce((sum, sub) => sum + sub.average3Months, 0),
        "Mois précédent": Object.values(category.subCategories).reduce((sum, sub) => sum + sub.previousMonth, 0),
        "Budget estimé": category.totalEstimated,
        "Budget ajusté": category.totalAdjusted || category.totalEstimated,
      };

      const subCategoryRows = Object.entries(category.subCategories).map(([subCategoryId, estimate]) => ({
        Catégorie: `  ${CATEGORY_NAMES[subCategoryId]}`,
        "Moyenne 6 mois": estimate.average6Months,
        "Moyenne 3 mois": estimate.average3Months,
        "Mois précédent": estimate.previousMonth,
        "Budget estimé": estimate.estimatedAmount,
        "Budget ajusté": estimate.adjustedAmount || estimate.estimatedAmount,
      }));

      return [mainCategoryRow, ...subCategoryRows];
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Prévisionnel - {displayBudget.month}</CardTitle>
          <ExportButton
            data={prepareExportData()}
            filename={`budget-${displayBudget.month}`}
            variant="outline"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Catégorie</TableHead>
                <TableHead 
                  className="w-[150px]" 
                  title={`Moyenne mensuelle calculée du ${startHistoricalPeriod} au ${endHistoricalPeriod}`}
                >
                  Moyenne historique
                </TableHead>
                <TableHead 
                  className="w-[150px]" 
                  title="Moyenne sur les 3 derniers mois"
                >
                  Moyenne 3 mois
                </TableHead>
                <TableHead 
                  className="w-[150px]" 
                  title={`Total des dépenses de ${previousMonth}`}
                >
                  Mois précédent
                </TableHead>
                <TableHead 
                  className="w-[120px]" 
                  title="Différence entre le mois précédent et la moyenne sur 3 mois"
                >
                  Variation vs 3 mois
                </TableHead>
                <TableHead 
                  className="w-[120px]" 
                  title="Différence entre le mois précédent et la moyenne historique"
                >
                  Variation vs moyenne
                </TableHead>
                <TableHead 
                  className="w-[150px]" 
                  title="Montant prévu pour le mois prochain basé sur l'historique et les tendances"
                >
                  Prévision auto.
                </TableHead>
                <TableHead 
                  className="w-[150px]" 
                  title="Ajustez manuellement le montant prévu si nécessaire"
                >
                  Budget souhaité
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(displayBudget.categories).map(([mainCategory, category]) => (
                <>
                  <TableRow key={mainCategory} className="font-medium bg-muted/50">
                    <TableCell>{CATEGORY_NAMES[mainCategory]}</TableCell>
                    <TableCell>
                      {formatCurrency(Object.values(category.subCategories).reduce(
                        (sum, sub) => sum + sub.average6Months,
                        0
                      ))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Object.values(category.subCategories).reduce(
                        (sum, sub) => sum + sub.average3Months,
                        0
                      ))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Object.values(category.subCategories).reduce(
                        (sum, sub) => sum + sub.previousMonth,
                        0
                      ))}
                    </TableCell>
                    <TableCell>
                      {formatVariation(
                        Object.values(category.subCategories).reduce(
                          (sum, sub) => sum + sub.previousMonth,
                          0
                        ),
                        Object.values(category.subCategories).reduce(
                          (sum, sub) => sum + sub.average3Months,
                          0
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      {formatVariation(
                        Object.values(category.subCategories).reduce(
                          (sum, sub) => sum + sub.previousMonth,
                          0
                        ),
                        Object.values(category.subCategories).reduce(
                          (sum, sub) => sum + sub.average6Months,
                          0
                        )
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(category.totalEstimated)}</TableCell>
                    <TableCell>
                      {formatCurrency(category.totalAdjusted || category.totalEstimated)}
                    </TableCell>
                  </TableRow>
                  {Object.entries(category.subCategories).map(([subCategoryId, estimate]) => (
                    <TableRow key={subCategoryId} className="text-sm">
                      <TableCell className="pl-6">{CATEGORY_NAMES[subCategoryId]}</TableCell>
                      <TableCell>{formatCurrency(estimate.average6Months)}</TableCell>
                      <TableCell>{formatCurrency(estimate.average3Months)}</TableCell>
                      <TableCell>{formatCurrency(estimate.previousMonth)}</TableCell>
                      <TableCell>
                        {formatVariation(estimate.previousMonth, estimate.average3Months)}
                      </TableCell>
                      <TableCell>
                        {formatVariation(estimate.previousMonth, estimate.average6Months)}
                      </TableCell>
                      <TableCell>{formatCurrency(estimate.estimatedAmount)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={estimate.adjustedAmount ?? ''}
                          onChange={(e) => handleAdjustmentChange(subCategoryId, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {/* Ligne des totaux */}
              <TableRow className="font-bold bg-muted">
                <TableCell>Total Dépenses</TableCell>
                <TableCell>
                  {formatCurrency(
                    Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.average6Months,
                        0
                      ),
                      0
                    )
                  )}
                </TableCell>
                <TableCell>
                  {formatCurrency(
                    Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.average3Months,
                        0
                      ),
                      0
                    )
                  )}
                </TableCell>
                <TableCell>
                  {formatCurrency(
                    Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.previousMonth,
                        0
                      ),
                      0
                    )
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const totalAverage3Months = Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.average3Months,
                        0
                      ),
                      0
                    );
                    const totalPrevious = Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.previousMonth,
                        0
                      ),
                      0
                    );
                    return formatVariation(totalPrevious, totalAverage3Months);
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const totalAverage6Months = Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.average6Months,
                        0
                      ),
                      0
                    );
                    const totalPrevious = Object.values(displayBudget.categories).reduce(
                      (sum, category) => sum + Object.values(category.subCategories).reduce(
                        (subSum, sub) => subSum + sub.previousMonth,
                        0
                      ),
                      0
                    );
                    return formatVariation(totalPrevious, totalAverage6Months);
                  })()}
                </TableCell>
                <TableCell>
                  {formatCurrency(displayBudget.totalEstimated)}
                </TableCell>
                <TableCell>
                  {formatCurrency(displayBudget.totalAdjusted || displayBudget.totalEstimated)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ajout de la vue comparative */}
      <BudgetComparison 
        transactions={transactions}
        currentBudget={displayBudget}
      />
    </div>
  );
}
