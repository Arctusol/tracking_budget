# Receipt Processing System

This directory contains components for handling receipt uploads, analysis, and visualization using Azure Document Intelligence.

## Component Structure

### Components
- `ReceiptUpload.tsx`: Handles receipt file uploads and processing
  - Uses Azure Document Intelligence for OCR and data extraction
  - Supports image formats (JPEG, PNG)
  - Integrates with Supabase for storage
  - Provides upload progress feedback

- `ReceiptHistory.tsx`: Displays uploaded receipts history
  - Shows merchant, date, total, and category
  - Provides links to original receipt images
  - Includes refresh functionality
  - Status tracking for each receipt

- `ReceiptAnalysisDashboard.tsx`: Visualizes receipt data
  - Category-based spending analysis
  - Merchant frequency analysis
  - Total spending trends

### Services
- `receipt.service.ts`: Core service for receipt processing
  - Azure Document Intelligence integration
  - Receipt data extraction and normalization
  - Category detection
  - Database operations

## Technical Details

### Azure Document Intelligence Integration
- Uses Layout API for document analysis
- Processes specific polygon regions for French receipts
- Extracts:
  - Merchant name from header
  - Items and prices
  - Total amount
  - Date information

### Database Schema
The system requires the following tables:

```sql
-- Receipts table
CREATE TABLE receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    merchant_name TEXT,
    total DECIMAL(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT,
    image_url TEXT,
    status TEXT CHECK (status IN ('pending', 'processed', 'error')),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Receipt items table
CREATE TABLE receipt_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_category ON receipts(category);
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);

-- RLS Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts"
    ON receipts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
    ON receipts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own receipt items"
    ON receipt_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM receipts
        WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own receipt items"
    ON receipt_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM receipts
        WHERE receipts.id = receipt_items.receipt_id
        AND receipts.user_id = auth.uid()
    ));
```

## Remaining Tasks

1. Data Processing
   - [ ] Improve merchant name extraction accuracy
   - [ ] Add support for different receipt formats
   - [ ] Implement receipt date extraction
   - [ ] Handle multiple currencies

2. User Interface
   - [ ] Add receipt editing capabilities
   - [ ] Implement batch upload
   - [ ] Add receipt search functionality
   - [ ] Create detailed receipt view

3. Analysis
   - [ ] Add more visualization types
   - [ ] Implement merchant spending patterns
   - [ ] Add export functionality
   - [ ] Create monthly/yearly reports

4. Integration
   - [ ] Link receipts with transactions
   - [ ] Add group sharing capabilities
   - [ ] Implement receipt categorization rules
   - [ ] Add budget impact analysis

5. Testing
   - [ ] Add unit tests for components
   - [ ] Add integration tests for Azure AI
   - [ ] Test with various receipt formats
   - [ ] Performance testing for large uploads

## Dependencies
- @azure-rest/ai-document-intelligence
- @supabase/supabase-js
- date-fns
- react-query (for data fetching)
- shadcn/ui components
