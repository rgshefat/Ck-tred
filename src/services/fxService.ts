import { CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToBaseUSD: 1.0, decimals: 2 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateToBaseUSD: 122.5, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToBaseUSD: 0.92, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToBaseUSD: 0.79, decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToBaseUSD: 1.36, decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToBaseUSD: 1.52, decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToBaseUSD: 154.5, decimals: 0 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToBaseUSD: 0.90, decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToBaseUSD: 1.34, decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToBaseUSD: 83.4, decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToBaseUSD: 3.67, decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rateToBaseUSD: 7.82, decimals: 2 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rateToBaseUSD: 1.64, decimals: 2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rateToBaseUSD: 5.42, decimals: 2 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rateToBaseUSD: 10.55, decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateToBaseUSD: 18.25, decimals: 2 },
};

export class FXService {
  private static rates: Record<string, number> = Object.fromEntries(
    Object.entries(SUPPORTED_CURRENCIES).map(([k, v]) => [k, v.rateToBaseUSD])
  );
  private static currentBase: string = 'USD';

  public static getSupportedCurrencies(): CurrencyConfig[] {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  public static getAllRates(): Record<string, number> {
    return { ...this.rates };
  }

  public static setBaseCurrency(base: string) {
    this.currentBase = base;
  }

  public static updateRates(newRates: Record<string, number>) {
    this.rates = { ...this.rates, ...newRates };
  }

  public static getRate(currencyCode: string): number {
    return this.rates[currencyCode] || 1.0;
  }

  public static convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = this.getRate(fromCurrency); // rate to 1 USD
    const toRate = this.getRate(toCurrency);
    // Convert from -> USD -> to
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
  }

  public static format(amount: number, currencyCode: string = 'USD'): string {
    const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
    const decimals = config.decimals !== undefined ? config.decimals : 2;
    
    // Format nicely with standard separators
    const formattedNum = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${config.symbol}${formattedNum}`;
  }

  public static formatWithCode(amount: number, currencyCode: string = 'USD'): string {
    return `${this.format(amount, currencyCode)} ${currencyCode}`;
  }
}
