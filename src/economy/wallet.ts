export type Entry = { id: string; label: string; amount: number };
export class Wallet {
  balance: number;
  ledger: Entry[] = [];
  constructor(balance: number) {
    if (!Number.isSafeInteger(balance) || balance < 0)
      throw Error("Invalid budget");
    this.balance = balance;
  }
  spend(id: string, label: string, amount: number) {
    if (
      this.ledger.some((e) => e.id === id) ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      amount > this.balance
    )
      return false;
    this.balance -= amount;
    this.ledger.push({ id, label, amount: -amount });
    return true;
  }
  credit(id: string, label: string, amount: number) {
    if (
      this.ledger.some((e) => e.id === id) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      this.balance + amount > 10000000
    )
      return false;
    this.balance += amount;
    this.ledger.push({ id, label, amount });
    return true;
  }
}
export function purchasingPower(salary: number, priceIndex: number) {
  return Math.floor(salary / Math.max(1, priceIndex));
}
