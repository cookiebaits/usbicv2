"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { fetchColors, formatDate, formatPrice } from "@/lib/utils";
import BgShadows from "@/components/ui/bgShadows";

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

  // Fetch colors
  useEffect(() => {
    fetchColors();
  }, []);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiFetch("/api/accounts", {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        const newAccounts: Account[] = [
          {
            name: "Checking Account",
            number:
              data.checkingNumber?.slice(-4).padStart(12, "x") ||
              "xxxx-xxxx-xxxx",
            fullNumber: data.checkingNumber || "Not Available",
            balance: data.checkingBalance || 0,
            type: "checking",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
          {
            name: "Savings Account",
            number:
              data.savingsNumber?.slice(-4).padStart(12, "x") ||
              "xxxx-xxxx-xxxx",
            fullNumber: data.savingsNumber || "Not Available",
            balance: data.savingsBalance || 0,
            type: "savings",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
        ];
        setAccounts(newAccounts);
        setError(null);
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Unauthorized") {
          console.error("Fetch error:", error.message);
          setError(error.message);
          setAccounts([
            {
              name: "Checking Account",
              number: "xxxx-xxxx-xxxx",
              fullNumber: "Not Available",
              balance: 0,
              type: "checking",
              status: "active",
              openedDate: "N/A",
            },
            {
              name: "Savings Account",
              number: "xxxx-xxxx-xxxx",
              fullNumber: "Not Available",
              balance: 0,
              type: "savings",
              status: "active",
              openedDate: "N/A",
            },
          ]);
        }
      }
    };

    fetchAccounts();
  }, []);

  // Fetch transactions for both accounts
  useEffect(() => {
    const fetchTransactions = async (accountType: string) => {
      try {
        const response = await apiFetch(
          `/api/accounts/transactions?accountType=${accountType}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        return data.transactions || [];
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Unauthorized") {
          console.error(`Fetch transactions error for ${accountType}:`, error.message);
        }
        return [];
      }
    };

    const fetchAllTransactions = async () => {
      const checkingTx = await fetchTransactions("checking");
      const savingsTx = await fetchTransactions("savings");
      setTransactions({
        checking: checkingTx,
        savings: savingsTx,
      });
    };

    fetchAllTransactions();
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      <BgShadows />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="mb-4 bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            My Accounts
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {accounts.map((account) => (
          <div key={account.type} className="mb-12">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div
                  className={`absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity`}
                ></div>
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold text-primary-900">
                        {account.name}
                      </CardTitle>
                      <CardDescription className="text-primary-700">
                        Account Details
                      </CardDescription>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none">
                      {account.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600 font-medium">
                        Current Balance
                      </span>
                      <span className="font-bold text-lg text-primary-900">
                        ${formatPrice(account.balance)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-primary-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-600 font-medium">
                        Account Number
                      </span>
                      <div className="flex items-center">
                        <span className="font-mono mr-2 text-primary-900">
                          {showNumbers[account.type]
                            ? account.fullNumber
                            : account.number}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary-600 hover:text-primary-800 hover:bg-primary-100"
                          onClick={() =>
                            setShowNumbers((prev) => ({
                              ...prev,
                              [account.type]: !prev[account.type],
                            }))
                          }
                        >
                          {showNumbers[account.type] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600 font-medium">
                        Account Type
                      </span>
                      <span className="capitalize text-primary-900">
                        {account.type}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600 font-medium">
                        Opened On
                      </span>
                      <span className="text-primary-900">
                        {formatDate(account.openedDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end relative z-10">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Link href="/dashboard/transfers">
                      <Plus className="mr-2 h-4 w-4" />
                      New Transaction
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-primary-900">
                    Recent {account.name} Transactions
                  </CardTitle>
                  <CardDescription className="text-primary-700">
                    Last 3 transactions on this account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions[account.type]?.slice(0, 3).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-primary-50/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-primary-900">
                            {tx.description}
                          </div>
                          <div className="text-sm text-primary-600">
                            {formatDate(tx.date)}
                          </div>
                        </div>
                        <div
                          className={`font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                        >
                          ${formatPrice(Math.abs(tx.amount))}
                        </div>
                      </div>
                    ))}
                    {(!transactions[account.type] || transactions[account.type].length === 0) && (
                      <div className="text-center text-primary-600">
                        No transactions found.
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                    asChild
                  >
                    <Link href="/dashboard/transactions">
                      <History className="mr-2 h-4 w-4" />
                      View All Transactions
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}