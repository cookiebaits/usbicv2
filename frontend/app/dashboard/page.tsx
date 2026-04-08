"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CreditCard, Home, LogOut, Menu, Send, User, FileText, Loader2, Bitcoin, ArrowLeftRight } from "lucide-react"
import { FaBitcoinSign } from "react-icons/fa6"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth, logout } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { fetchColors, formatDate, formatPrice } from "@/lib/utils"
import { useZelleLogo } from "../zellLogoContext"
import { useTopBarHeight } from '../TopBarContext'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: string
  status: string
  accountType?: string
  category?: string
  cryptoAmount?: number
  cryptoPrice?: number
  memo?: string
  zellePersonInfo?: any
  recipientWallet?: string
}

interface UserData {
  fullName: string
  checkingBalance: string
  savingsBalance: string
  cryptoBalance: number
  email: string
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/accounts", icon: CreditCard, label: "Accounts" },
  { href: "/dashboard/transactions", icon: FileText, label: "Transactions" },
  { href: "/dashboard/transfers", icon: Send, label: "Transfers" },
  { href: "/dashboard/crypto", icon: Bitcoin, label: "BTC Wallet" },
]

const settingsItems = [
  { href: "/dashboard/profile", icon: User, label: "Profile" },
]

function SidebarNav({ onLogout }: { onLogout: () => void }) {
  return (
    <>
      <nav className="flex-1 py-6">
        <div className="px-3 mb-2">
          <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-slate-400 px-3">Main</span>
        </div>
        <div className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl h-10 text-sm font-medium" asChild data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <Link href={item.href}>
                <item.icon className="mr-2.5 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
        <div className="px-3 mt-6 mb-2">
          <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-slate-400 px-3">Settings</span>
        </div>
        <div className="space-y-0.5 px-2">
          {settingsItems.map((item) => (
            <Button key={item.href} variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl h-10 text-sm font-medium" asChild data-testid={`nav-${item.label.toLowerCase()}`}>
              <Link href={item.href}>
                <item.icon className="mr-2.5 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl h-10 text-sm font-medium" onClick={onLogout} data-testid="nav-logout">
            <LogOut className="mr-2.5 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>
    </>
  )
}

export default function DashboardPage() {
  useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [cryptoValue, setCryptoValue] = useState<number>(0)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { zelleLogoUrl } = useZelleLogo()
  const topBarHeight = useTopBarHeight()

  useEffect(() => {
    fetchColors()
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home")
        if (response.ok) setSettings(await response.json())
      } catch {}
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const userResponse = await apiFetch("/api/user")
        if (!userResponse.ok) throw new Error("Failed to fetch user data")
        const userData = await userResponse.json()
        setUserData({
          fullName: userData.fullName || "",
          checkingBalance: formatPrice(Math.abs(userData.balance)),
          savingsBalance: formatPrice(Math.abs(userData.savingsBalance)),
          cryptoBalance: userData.cryptoBalance || 0,
          email: userData.email || "",
        })

        const priceResponse = await fetch("/api/price")
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          setBtcPrice(priceData.bitcoin?.usd || 0)
        }

        const transactionsResponse = await apiFetch("/api/transactions")
        setIsLoading(false)
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions((transactionsData.transactions || []).map((tx: any) => ({ ...tx, id: tx._id?.toString() || tx.id })))
        }
      } catch (error: any) {
        setIsLoading(false)
        if (error.message !== 'Unauthorized') {
          setError("An error occurred while loading your dashboard")
        }
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (userData) setCryptoValue(userData.cryptoBalance * btcPrice)
  }, [userData, btcPrice])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/price")
        if (response.ok) {
          const data = await response.json()
          setBtcPrice(data.bitcoin?.usd || 0)
        }
      } catch {}
    }, 600000)
    return () => clearInterval(interval)
  }, [])

  const getTransactionLabel = (tx: Transaction) => {
    if (tx.category === "Zelle External") return `Zelle: ${tx.zellePersonInfo?.recipientName || ''}`
    if (tx.category === "admin" && tx.type === "withdrawal") return `Withdraw: ${tx.description}`
    if (tx.category === "admin" && tx.type === "deposit") return `Deposit: ${tx.description}`
    if (tx.type === "bitcoin_transfer") return `BTC Send: ${tx.memo || tx.description}`
    if (tx.type === "transfer" && tx.category === "External Transfer") return `Wire Transfer: ${tx.description}`
    if (tx.type === "transfer" && tx.category === "Transfer") return `Transfer: ${tx.description}`
    return tx.description
  }

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.accountType === "crypto" || tx.type === "crypto_buy" || tx.type === "crypto_sell" || tx.type === "bitcoin_transfer" || (tx.category === "admin" && tx.accountType === "crypto")) {
      return <FaBitcoinSign className="h-4 w-4 text-amber-600" />
    }
    if (tx.type === "zelle" || tx.category === "Zelle External") {
      return <img src="/zellez.png" alt="Zelle" className="h-4 w-auto" />
    }
    return null
  }

  const firstName = userData?.fullName?.split(' ')[0] || ''

  return (
    <div data-testid="dashboard-page" className="bg-slate-50 min-h-screen">
      <div className="flex max-w-[1300px] mx-auto">
        {/* Mobile Nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40 bg-white shadow-sm border-slate-200 rounded-xl" data-testid="mobile-menu-btn">
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex h-full flex-col bg-white">
              <div className="p-4 border-b border-slate-100">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" style={{ width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto', height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '28px' }} />
                ) : <div style={{ height: '28px' }} />}
              </div>
              <SidebarNav onLogout={() => logout("user")} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-56 flex-col fixed inset-y-0" style={{ top: `${topBarHeight}px` }}>
          <SidebarNav onLogout={() => logout("user")} />
        </div>

        {/* Main Content */}
        <div className="md:pl-56 flex-1 flex flex-col min-h-screen">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Greeting */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="dashboard-greeting">
                {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Here's your financial overview</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200" data-testid="dashboard-error">
                {error}
              </div>
            )}

            {/* Account Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Checking */}
              <Link href="/dashboard/accounts" data-testid="checking-card">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="text-xs tracking-[0.05em] uppercase font-semibold text-slate-500 mb-1">Checking</div>
                  <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono-numbers">${userData?.checkingBalance || '0.00'}</div>
                  <div className="text-xs text-slate-400 mt-1">Available balance</div>
                  <div className="mt-4 flex gap-2">
                    <span className="inline-flex items-center text-xs font-medium text-[var(--primary-700)] bg-[var(--primary-50)] px-3 py-1 rounded-full group-hover:bg-[var(--primary-100)] transition-colors">Send Money</span>
                    <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Details</span>
                  </div>
                </div>
              </Link>

              {/* Savings */}
              <Link href="/dashboard/accounts" data-testid="savings-card">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="text-xs tracking-[0.05em] uppercase font-semibold text-slate-500 mb-1">Savings</div>
                  <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono-numbers">${userData?.savingsBalance || '0.00'}</div>
                  <div className="text-xs text-slate-400 mt-1">Available balance</div>
                  <div className="mt-4 flex gap-2">
                    <span className="inline-flex items-center text-xs font-medium text-[var(--primary-700)] bg-[var(--primary-50)] px-3 py-1 rounded-full group-hover:bg-[var(--primary-100)] transition-colors">Transfer</span>
                    <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Details</span>
                  </div>
                </div>
              </Link>

              {/* Bitcoin */}
              <Link href="/dashboard/crypto" data-testid="crypto-card">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="text-xs tracking-[0.05em] uppercase font-semibold text-amber-600 mb-1">Bitcoin</div>
                  <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono-numbers">{(userData?.cryptoBalance || 0).toFixed(6)} <span className="text-lg text-slate-500">BTC</span></div>
                  <div className="text-xs text-slate-400 mt-1">&asymp; ${formatPrice(Math.abs(cryptoValue))} &middot; ${formatPrice(Math.abs(btcPrice))}/BTC</div>
                  <div className="mt-4 flex gap-2">
                    <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full group-hover:bg-amber-100 transition-colors">Buy/Sell</span>
                    <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Details</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900" data-testid="recent-transactions-title">Recent Activity</h2>
                <Button variant="ghost" size="sm" className="text-sm text-slate-500 hover:text-slate-900 rounded-full" asChild>
                  <Link href="/dashboard/transactions">View All</Link>
                </Button>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    <p className="mt-2 text-sm text-slate-400">Loading transactions...</p>
                  </div>
                ) : transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors" data-testid={`tx-${tx.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.accountType === 'crypto' || tx.type?.includes('crypto') || tx.type === 'bitcoin_transfer' ? 'bg-amber-50' : tx.amount > 0 ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                        {getTransactionIcon(tx) || (
                          <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {tx.description?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{getTransactionLabel(tx)}</div>
                        <div className="text-xs text-slate-400">
                          {formatDate(tx.date)}
                          {tx.category === "Zelle External" ? ` · ${tx.description}` : ""}
                          {tx.type === "bitcoin_transfer" ? ` · ${tx.recipientWallet}` : ""}
                        </div>
                      </div>
                    </div>
                    {tx.accountType === "crypto" || tx.type?.includes('crypto') || tx.type === 'bitcoin_transfer' ? (
                      <span className={`text-sm font-semibold font-mono-numbers flex-shrink-0 ml-4 ${tx.cryptoAmount && tx.cryptoAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.cryptoAmount ? Math.abs(tx.cryptoAmount).toFixed(6) + " BTC" : ""}
                      </span>
                    ) : (
                      <span className={`text-sm font-semibold font-mono-numbers flex-shrink-0 ml-4 ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.amount > 0 ? '+' : '-'}${formatPrice(Math.abs(tx.amount))}
                      </span>
                    )}
                  </div>
                ))}
                {(!isLoading && transactions.length === 0) && (
                  <div className="py-12 text-center text-sm text-slate-400" data-testid="no-transactions">
                    {error ? "Unable to load transactions" : "No recent transactions"}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
