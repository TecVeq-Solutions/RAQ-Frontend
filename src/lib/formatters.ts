/**
 * Presentation-only formatters for invoices and quantities.
 * Ensures consistent 6-character invoice display and clean quantity formatting without unwanted '.00'.
 */

/**
 * Formats an invoice number to exactly 6 characters (digits).
 * Handles raw numeric IDs, existing 6-digit strings, legacy prefixes (e.g. 'INV-000006', 'SAL-20260914-0001', 'SAL-000007'),
 * and empty/null/undefined edge cases safely.
 */
export function formatInvoiceNumber(invoiceNo?: string | number | null): string {
  if (invoiceNo === null || invoiceNo === undefined || invoiceNo === '') {
    return '000000';
  }

  const str = String(invoiceNo).trim();

  // If already pure digits
  if (/^\d+$/.test(str)) {
    return str.padStart(6, '0');
  }

  // If contains prefixes like INV-000006 or SAL-20260914-0001 or SAL-TEST-001
  const matches = str.match(/\d+/g);
  if (matches && matches.length > 0) {
    // Use the last group of numbers (sequence/invoice number)
    const lastNumStr = matches[matches.length - 1];
    const num = parseInt(lastNumStr, 10);
    if (!isNaN(num)) {
      return String(num).padStart(6, '0');
    }
  }

  return str.padStart(6, '0');
}

/**
 * Formats a quantity value for display:
 * - If whole number (e.g. 1.00, 2.00, 10.00), displays as whole number ('1', '2', '10') without unwanted '.00'.
 * - If decimal (e.g. 2.5, 1.25, 0.75), preserves valid decimal precision.
 * 
 * STRICTLY FOR PRESENTATION ONLY. NEVER use this function to calculate inventory, stock, or ledger transactions.
 */
export function formatQuantity(qty?: number | string | null): string {
  if (qty === null || qty === undefined || qty === '') {
    return '0';
  }

  const num = typeof qty === 'number' ? qty : parseFloat(String(qty));
  if (isNaN(num)) {
    return String(qty);
  }

  // Convert to clean decimal representation (e.g., 2.00 -> 2, 2.50 -> 2.5, 1.25 -> 1.25)
  return parseFloat(num.toFixed(4)).toString();
}
