"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Send, ArrowLeftRight, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { fetchColors, formatDate, formatPrice } from "@/lib/utils";

interface Account {
  name: string;
  number: string;
  fullNumber: string;
  balance: number;
  type: string;
  status: string;
  openedDate: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  accountType: string;
}

function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group" data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[var(--primary-50)] transition-colors">
        <Icon className="h-5 w-5 text-slate-700 group-hover:text-[var(--primary-700)]" />
      </div>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </Link>
  );
}

function AccountSection({ account, showNumber, toggleShow, transactions }: {
  account: Account;
  showNumber: boolean;
  toggleShow: () => void;
  transactions: Transaction[];
}) {
  const maskedNumber = account.fullNumber !== "Not Available"
    ? "••••••••" + account.fullNumber.slice(-4)
    : "••••••••••••";

  return (
    <div data-testid={`account-section-${account.type}`} className="mb-10">
      {/* Account Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Account Label */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.05em] uppercase font-semibold text-slate-500">{account.name}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${account.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`} data-testid={`account-status-${account.type}`}>
              {account.status}
            </span>
          </div>
          <span className="text-xs text-slate-400">Opened {formatDate(account.openedDate)}</span>
        </div>

        {/* Balance */}
        <div className="mt-2 mb-6" data-testid={`account-balance-${account.type}`}>
          <span className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tighter font-mono-numbers">
            ${formatPrice(account.balance)}
          </span>
          <span className="block mt-1 text-sm text-slate-400">Available balance</span>
        </div>

        {/* Account Number Row */}
        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-6" data-testid={`account-number-row-${account.type}`}>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-slate-400 block">Account Number</span>
              <span className="font-mono-numbers text-sm text-slate-700 mt-0.5 block">
                {showNumber ? account.fullNumber : maskedNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-slate-400 block">Routing Number</span>
              <span className="font-mono-numbers text-sm text-slate-700 mt-0.5 block">
                {showNumber ? "021000021" : "•••••••••"}
              </span>
            </div>
          </div>
          <button
            onClick={toggleShow}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            data-testid={`toggle-account-number-${account.type}`}
          >
            {showNumber ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 sm:gap-12">
          <QuickAction icon={PlusCircle} label="Add Money" href="/dashboard/transfers" />
          <QuickAction icon={ArrowLeftRight} label="Transfer" href="/dashboard/transfers" />
          <QuickAction icon={Send} label="Send" href="/dashboard/transfers" />
          <QuickAction icon={FileText} label="Statements" href="/dashboard/transactions" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors" data-testid={`transaction-item-${tx.id}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {tx.description?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{tx.description}</div>
                  <div className="text-xs text-slate-400">{formatDate(tx.date)}</div>
                </div>
              </div>
              <span className={`text-sm font-semibold font-mono-numbers ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {tx.amount > 0 ? '+' : '-'}${formatPrice(Math.abs(tx.amount))}
              </span>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No transactions yet</div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-slate-100">
          <Button variant="ghost" className="w-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl" asChild data-testid={`view-all-tx-${account ? 'account' : ''}`}>
            <Link href="/dashboard/transactions">View All Transactions</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  useAuth();

  const [showNumbers, setShowNumbers] = useState<{ [key: string]: boolean }>({
    checking: false,
    savings: false,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<{ [key: string]: Transaction[] }>({
    checking: [],
    savings: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiFetch("/api/accounts", { method: "GET" });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAccounts([
          {
            name: "Checking Account",
            number: data.checkingNumber?.slice(-4).padStart(12, "•") || "••••••••••••",
            fullNumber: data.checkingNumber || "Not Available",
            balance: data.checkingBalance || 0,
            type: "checking",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
          {
            name: "Savings Account",
            number: data.savingsNumber?.slice(-4).padStart(12, "•") || "••••••••••••",
            fullNumber: data.savingsNumber || "Not Available",
            balance: data.savingsBalance || 0,
            type: "savings",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
        ]);
        setError(null);
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Unauthorized") {
          setError(error.message);
          setAccounts([
            { name: "Checking Account", number: "••••••••••••", fullNumber: "Not Available", balance: 0, type: "checking", status: "active", openedDate: "N/A" },
            { name: "Savings Account", number: "••••••••••••", fullNumber: "Not Available", balance: 0, type: "savings", status: "active", openedDate: "N/A" },
          ]);
        }
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchTransactions = async (accountType: string) => {
      try {
        const response = await apiFetch(`/api/accounts/transactions?accountType=${accountType}`, { method: "GET" });
        if (!response.ok) return [];
        const data = await response.json();
        return data.transactions || [];
      } catch {
        return [];
      }
    };
    const fetchAll = async () => {
      const [checkingTx, savingsTx] = await Promise.all([
        fetchTransactions("checking"),
        fetchTransactions("savings"),
      ]);
      setTransactions({ checking: checkingTx, savings: savingsTx });
    };
    fetchAll();
  }, []);

  return (
    <div data-testid="accounts-page" className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full -ml-2"
            data-testid="back-to-dashboard-btn"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Accounts</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">
            {error}
          </div>
        )}

        {accounts.map((account) => (
          <AccountSection
            key={account.type}
            account={account}
            showNumber={showNumbers[account.type]}
            toggleShow={() => setShowNumbers((prev) => ({ ...prev, [account.type]: !prev[account.type] }))}
            transactions={transactions[account.type] || []}
          />
        ))}
      </div>
    </div>
  );
}
