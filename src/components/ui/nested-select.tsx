import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CATEGORY_HIERARCHY, CATEGORY_HIERARCHY_INCOME, CATEGORY_NAMES, CATEGORY_IDS } from '@/lib/constants/constants';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface NestedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeIncome?: boolean;
}

export function NestedSelect({
  value,
  onValueChange,
  placeholder = "Sélectionner une catégorie",
  includeIncome = true
}: NestedSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Build category tree
  const buildCategoryTree = () => {
    const tree: Category[] = [];
    
    // Process expense categories
    Object.entries(CATEGORY_HIERARCHY).forEach(([parentId, childIds]) => {
      const parent: Category = {
        id: parentId,
        name: CATEGORY_NAMES[parentId],
        children: childIds
          .filter(id => id && CATEGORY_NAMES[id])
          .map(id => ({
            id,
            name: CATEGORY_NAMES[id]
          }))
      };
      tree.push(parent);
    });

    // Process income categories if included
    if (includeIncome) {
      Object.entries(CATEGORY_HIERARCHY_INCOME).forEach(([parentId, childIds]) => {
        const parent: Category = {
          id: parentId,
          name: CATEGORY_NAMES[parentId],
          children: childIds
            .filter(id => id && CATEGORY_NAMES[id])
            .map(id => ({
              id,
              name: CATEGORY_NAMES[id]
            }))
        };
        tree.push(parent);
      });
    }

    return tree;
  };

  const categoryTree = buildCategoryTree();

  // Filter categories based on search query
  const getFilteredCategories = () => {
    if (!searchQuery) return categoryTree;

    const searchLower = searchQuery.toLowerCase();
    return categoryTree
      .map(category => ({
        ...category,
        children: category.children?.filter(child =>
          child.name.toLowerCase().includes(searchLower)
        )
      }))
      .filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        (category.children && category.children.length > 0)
      );
  };

  const filteredCategories = getFilteredCategories();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? CATEGORY_NAMES[value] : placeholder}
          <ChevronRight className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50",
            open && "rotate-90 transition-transform"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false} className="w-full">
          <CommandInput 
            placeholder="Rechercher une catégorie..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
            {filteredCategories.map((category) => (
              <CommandGroup key={category.id} heading={category.name}>
                <CommandItem
                  key={`parent-${category.id}`}
                  value={category.id}
                  onSelect={() => {
                    onValueChange(category.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="font-medium">{category.name}</span>
                  {value === category.id && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
                {category.children?.map((child) => (
                  <CommandItem
                    key={child.id}
                    value={child.id}
                    onSelect={() => {
                      onValueChange(child.id);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="pl-6 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {child.name}
                    {value === child.id && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
