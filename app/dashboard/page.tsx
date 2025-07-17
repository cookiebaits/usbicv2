"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, CreditCard, Home, LogOut, Menu, Send, User, FileText, ArrowDown, ArrowUp, RefreshCcw, Loader2 } from "lucide-react"
import Color from 'color'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth, logout } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import { formatDate, formatPrice } from "@/lib/utils"
import BgShadows from "@/components/ui/bgShadows"

// Transaction interface
interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type:
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "payment"
  | "fee"
  | "interest"
  | "crypto_buy"
  | "crypto_sell" | "bitcoin_transfer"
  status: "completed" | "pending" | "failed"
  accountType?: "checking" | "savings" | "crypto"
  category?: string
  cryptoAmount?: number
  cryptoPrice?: number
  memo?: string
}

// UserData interface
interface UserData {
  fullName: string
  checkingBalance: string
  savingsBalance: string
  cryptoBalance: number
  email: string
}

// Contact interface
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  initials: string
}

export default function DashboardPage() {
  useAuth() // Proactively check token expiration

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [cryptoValue, setCryptoValue] = useState<number>(0)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true);

  // Fetch colors and settings
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/colors')
        if (response.ok) {
          const data = await response.json()
          setColors(data)

          const primary = Color(data.primaryColor)
          const secondary = Color(data.secondaryColor)

          const generateShades = (color: typeof Color.prototype) => ({
            50: color.lighten(0.5).hex(),
            100: color.lighten(0.4).hex(),
            200: color.lighten(0.3).hex(),
            300: color.lighten(0.2).hex(),
            400: color.lighten(0.1).hex(),
            500: color.hex(),
            600: color.darken(0.1).hex(),
            700: color.darken(0.2).hex(),
            800: color.darken(0.3).hex(),
            900: color.darken(0.4).hex(),
          })

          const primaryShades = generateShades(primary)
          const secondaryShades = generateShades(secondary)

          Object.entries(primaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(`--primary-${shade}`, color)
          })

          Object.entries(secondaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(`--secondary-${shade}`, color)
          })
        } else {
          console.error('Failed to fetch colors')
        }
      } catch (error) {
        console.error('Error fetching colors:', error)
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          setSettings(null)
        }
      } catch (error) {
        setSettings(null)
      }
    }

    fetchColors()
    fetchSettings()
  }, [])

  // Fetch user data, transactions, and initial BTC price
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user data
        const userResponse = await apiFetch("/api/user")
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await userResponse.json()
        setUserData({
          fullName: userData.fullName || "",
          checkingBalance: formatPrice(Math.abs(userData.balance)),
          savingsBalance: formatPrice(Math.abs(userData.savingsBalance)),
          cryptoBalance: userData.cryptoBalance || 0,
          email: userData.email || "",
        })

        // Fetch BTC price (public endpoint, no auth required)
        const priceResponse = await fetch("/api/price")
        if (!priceResponse.ok) throw new Error("Failed to fetch BTC price")
        const priceData = await priceResponse.json()
        const newBtcPrice: number = priceData.bitcoin?.usd || 0
        setBtcPrice(newBtcPrice)

        // Fetch transactions
        const transactionsResponse = await apiFetch("/api/transactions").finally(() => setIsLoading(false))
        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json()
          setError(errorData.error || "Failed to fetch transactions")
          setTransactions([])
        } else {
          const transactionsData = await transactionsResponse.json()
          const mappedTransactions = (transactionsData.transactions || []).map((tx: any) => ({
            ...tx,
            id: tx._id.toString(),
          }))
          setTransactions(mappedTransactions)
        }

        // Load recent Zelle contacts from localStorage
        const storedContacts = localStorage.getItem("recentZelleContacts")
        const contacts = storedContacts ? JSON.parse(storedContacts) : []
        setRecentContacts(contacts)
      } catch (error: any) {
        if (error.message !== 'Unauthorized') {
          console.error("Error fetching data:", error)
          setError("An error occurred while loading your dashboard")
        }
        // Note: If error is 'Unauthorized', apiFetch handles logout
      }
    }

    fetchData()
  }, [])

  // Update crypto value when userData or btcPrice changes
  useEffect(() => {
    if (userData) {
      setCryptoValue(userData.cryptoBalance * btcPrice)
    }
  }, [userData, btcPrice])

  // Fetch BTC price every 10 minutes
  useEffect(() => {
    const priceInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/price")
        if (!response.ok) throw new Error("Price update failed")
        const data = await response.json()
        const newBtcPrice: number = data.bitcoin?.usd || 0
        setBtcPrice(newBtcPrice)
      } catch (error: unknown) {
        console.error("Price update error:", error instanceof Error ? error.message : 'Unknown error')
      }
    }, 600000) // 10 minutes = 600,000 ms

    return () => clearInterval(priceInterval)
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "interest":
        return <ArrowDown className="h-5 w-5 text-green-600" />
      case "withdrawal":
        return <ArrowUp className="h-5 w-5 text-red-600" />
      case "transfer":
        return <Send className="h-5 w-5 text-primary-600" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-orange-600" />
      case "fee":
        return <FileText className="h-5 w-5 text Bauch-600" />
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />
      case "crypto_buy":
      case "crypto_sell":
      case "bitcoin_transfer":
        return <CreditCard className="h-5 w-5 text-purple-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="overflow-hidden relative">
      
      <BgShadows />

      <div className="flex min-h-screen w-[84%] m-auto">
        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden fixed top-4 left-4 z-40 bg-white shadow-md border-primary-200"
            >
              <Menu className="h-5 w-5 text-primary-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex h-full flex-col bg-white/10 border border-white/20 shadow-lg text-white">
              <div className="p-4 border-b border-primary-700">
                <div className="flex items-center gap-2">
                  {settings?.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Site Logo"
                      style={{
                        width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
                        height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '32px',
                        filter: 'brightness(100%)',
                      }}
                    />
                  ) : (
                    <div style={{ height: '32px' }}></div>
                    // <img
                    //   src="/zelle-logo.svg"
                    //   alt="Zelle"
                    //   style={{ width: 'auto', height: '32px', filter: 'brightness(100%)' }}
                    // />
                  )}
                </div>
              </div>
              <nav className="flex-1 overflow-auto py-2">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-black">Main</h2>
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard/accounts">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Accounts
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard/transactions">
                        <FileText className="mr-2 h-4 w-4" />
                        Transactions
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard/transfers">
                        <Send className="mr-2 h-4 w-4" />
                        Transfers
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard/crypto">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Crypto
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-black">Settings</h2>
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" asChild>
                      <Link href="/dashboard/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-black hover:bg-white/10" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex text-white w-64 flex-col fixed inset-y-0">
          <div className="pt-10 p-4">
            <div className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Site Logo"
                  style={{
                    width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
                    height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '32px',
                    filter: 'brightness(100%)',
                  }}
                />
              ) : (
                <div style={{ height: '32px' }}></div>
                // <img
                //   src="/zelle-logo.svg"
                //   alt="Zelle"
                //   style={{ width: 'auto', height: '32px', filter: 'brightness(100%)' }}
                // />
              )}
            </div>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="px-1 py-2">
              <h2 className="mb-4 px-4 text-xs font-semibold tracking-tight text-black">Main</h2>
              <div className="space-y-4">
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard/accounts">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Accounts
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard/transactions">
                    <FileText className="mr-2 h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard/transfers">
                    <Send className="mr-2 h-4 w-4" />
                    Transfers
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard/crypto">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Crypto
                  </Link>
                </Button>
              </div>
            </div>
            <div className="px-1 py-2 pt-4">
              <h2 className="mb-4 px-4 text-xs font-semibold tracking-tight text-black">Settings</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="pt-4 md:pl-64 flex-1 flex flex-col">
          {/* <header className="bg-white border-b border-primary-100 h-16 sticky top-0 z-30 flex items-center shadow-sm">
          <div className="flex-1 px-6 pl-14 md:pl-6">
            <h1 className="text-xl font-bold md:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4 px-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>

              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/accounts">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Accounts</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header> */}
          <main className="sm:pl-0 sm:p-6 flex-1">
            <h1 className="text-2xl font-bold mb-6 hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
              Dashboard
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Account Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="relative group h-full">
                {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div> */}
                <Card className="relative bg-white h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary-600">Checking Account</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">${(userData?.checkingBalance || 0)}</div>
                    <p className="text-xs text-primary-500">Account #: xxxx-xxxx-4582</p>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                        asChild
                      >
                        <Link href="/dashboard/transfers">Send Money</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary-200 text-primary-600 hover:bg-primary-50"
                        asChild
                      >
                        <Link href="/dashboard/accounts">Details</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>



              <div className="relative group h-full">
                {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div> */}
                <Card className="relative bg-white h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary-600">Savings Account</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">${(userData?.savingsBalance || 0)}</div>
                    <p className="text-xs text-primary-500">Account #: xxxx-xxxx-4583</p>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                        asChild
                      >
                        <Link href="/dashboard/transfers">Send Money</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary-200 text-primary-600 hover:bg-primary-50"
                        asChild
                      >
                        <Link href="/dashboard/accounts">Details</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="relative group h-full">
                {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div> */}
                <Card className="relative bg-white h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-600">Bitcoin Wallet</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-2xl font-bold">{(userData?.cryptoBalance || 0).toFixed(6)} BTC</div>
                    <p className="text-xs text-amber-500">
                      ≈ ${formatPrice(Math.abs(cryptoValue))} (${formatPrice(Math.abs(btcPrice))}/BTC)
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
                        asChild
                      >
                        <Link href="/dashboard/crypto">Buy/Sell</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-200 text-amber-600 hover:bg-amber-50"
                        asChild
                      >
                        <Link href="/dashboard/crypto">Details</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Recent Transactions */}
            <h2 className="text-xl font-bold mb-4 text-primary-800">Recent Transactions</h2>
            <div className="relative">
              {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-20"></div> */}
              <Card className="relative">
                <CardContent className="p-0">
                  <div className="divide-y divide-primary-100">
                    {isLoading? <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
                                    <p className="mt-2 text-primary-700">Loading transactions...</p>
                                  </div> : transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="font-medium text-sm sm:text-base">
                              {transaction.category === "Zelle External"
                                ? `Zelle - ${transaction.zellePersonInfo.recipientName}`
                                : transaction.description}
                            </div>
                            <div className="text-xs text-primary-500">
                              {formatDate(transaction.date)}
                              {transaction.category === "Zelle External" ? ` - ${transaction.description}` : ""}
                            </div>
                          </div>
                        </div>
                        {transaction.accountType === "crypto" ? (
                          <div className={`font-bold text-sm sm:text-base ${transaction.cryptoAmount && transaction.cryptoAmount > 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {/* {transaction.cryptoAmount && transaction.cryptoAmount > 0 ? "+" : ""} */}
                            {transaction.cryptoAmount ? Math.abs(transaction.cryptoAmount).toFixed(6) + " BTC" : ""}
                          </div>
                        ) : (
                          <div className={`font-bold text-sm sm:text-base ${transaction.amount > 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {/* {transaction.amount > 0 ? "+" : "-"} */}
                            ${formatPrice(Math.abs(transaction.amount))}</div>
                        )}
                      </div>
                    ))}
                    {(!isLoading && transactions.length === 0) && (
                      <div className="p-4 text-center text-primary-500">
                        {error ? "Unable to load transactions" : "No recent transactions found."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                className="border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300"
                asChild
              >
                <Link href="/dashboard/transactions">View All Transactions</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}






























// "use client"

// import { useState, useEffect } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { ArrowUpRight, CreditCard, DollarSign, Home, LogOut, Menu, Send, User, FileText, ArrowDown, ArrowUp, RefreshCcw } from "lucide-react"
// import Color from 'color'

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { useAuth, logout } from '@/lib/auth'
// import { apiFetch } from '@/lib/api'
// import { LogoProvider, useLogo } from "@/app/logoContext";
// import { formatDate, formatPrice } from "@/lib/utils"

// // Transaction interface
// interface Transaction {
//   id: string
//   description: string
//   amount: number
//   date: string
//   type:
//   | "deposit"
//   | "withdrawal"
//   | "transfer"
//   | "payment"
//   | "fee"
//   | "interest"
//   | "crypto_buy"
//   | "crypto_sell" | "bitcoin_transfer"
//   status: "completed" | "pending" | "failed"
//   accountType?: "checking" | "savings" | "crypto"
//   category?: string
//   cryptoAmount?: number
//   cryptoPrice?: number
//   memo?: string
// }

// // UserData interface
// interface UserData {
//   fullName: string
//   checkingBalance: string
//   savingsBalance: string
//   cryptoBalance: number
//   email: string
// }

// // Contact interface
// interface Contact {
//   id: string
//   name: string
//   email: string
//   phone: string
//   initials: string
// }

// export default function DashboardPage() {
//   useAuth() // Proactively check token expiration

//   const router = useRouter()
//   const { logoUrl } = useLogo();

//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [userData, setUserData] = useState<UserData | null>(null)
//   const [cryptoValue, setCryptoValue] = useState<number>(0)
//   const [btcPrice, setBtcPrice] = useState<number>(0)
//   const [error, setError] = useState<string | null>(null)
//   const [recentContacts, setRecentContacts] = useState<Contact[]>([])
//   const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)
//   const [settings, setSettings] = useState<any>(null)

//   // Fetch colors and settings
//   useEffect(() => {
//     const fetchColors = async () => {
//       try {
//         const response = await fetch('/api/colors')
//         if (response.ok) {
//           const data = await response.json()
//           setColors(data)

//           const primary = Color(data.primaryColor)
//           const secondary = Color(data.secondaryColor)

//           const generateShades = (color: typeof Color.prototype) => ({
//             50: color.lighten(0.5).hex(),
//             100: color.lighten(0.4).hex(),
//             200: color.lighten(0.3).hex(),
//             300: color.lighten(0.2).hex(),
//             400: color.lighten(0.1).hex(),
//             500: color.hex(),
//             600: color.darken(0.1).hex(),
//             700: color.darken(0.2).hex(),
//             800: color.darken(0.3).hex(),
//             900: color.darken(0.4).hex(),
//           })

//           const primaryShades = generateShades(primary)
//           const secondaryShades = generateShades(secondary)

//           Object.entries(primaryShades).forEach(([shade, color]) => {
//             document.documentElement.style.setProperty(`--primary-${shade}`, color)
//           })

//           Object.entries(secondaryShades).forEach(([shade, color]) => {
//             document.documentElement.style.setProperty(`--secondary-${shade}`, color)
//           })
//         } else {
//           console.error('Failed to fetch colors')
//         }
//       } catch (error) {
//         console.error('Error fetching colors:', error)
//       }
//     }

//     const fetchSettings = async () => {
//       try {
//         const response = await fetch("/api/home")
//         if (response.ok) {
//           const data = await response.json()
//           setSettings(data)
//         } else {
//           setSettings(null)
//         }
//       } catch (error) {
//         setSettings(null)
//       }
//     }

//     fetchColors()
//     fetchSettings()
//   }, [])

//   // Fetch user data, transactions, and initial BTC price
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Fetch user data
//         const userResponse = await apiFetch("/api/user")
//         if (!userResponse.ok) {
//           throw new Error("Failed to fetch user data")
//         }
//         const userData = await userResponse.json()
//         setUserData({
//           fullName: userData.fullName || "",
//           checkingBalance: formatPrice(Math.abs(userData.balance)),
//           savingsBalance: formatPrice(Math.abs(userData.savingsBalance)),
//           cryptoBalance: userData.cryptoBalance || 0,
//           email: userData.email || "",
//         })

//         // Fetch BTC price (public endpoint, no auth required)
//         const priceResponse = await fetch("/api/price")
//         if (!priceResponse.ok) throw new Error("Failed to fetch BTC price")
//         const priceData = await priceResponse.json()
//         const newBtcPrice: number = priceData.bitcoin?.usd || 0
//         setBtcPrice(newBtcPrice)

//         // Fetch transactions
//         const transactionsResponse = await apiFetch("/api/transactions")
//         if (!transactionsResponse.ok) {
//           const errorData = await transactionsResponse.json()
//           setError(errorData.error || "Failed to fetch transactions")
//           setTransactions([])
//         } else {
//           const transactionsData = await transactionsResponse.json()
//           const mappedTransactions = (transactionsData.transactions || []).map((tx: any) => ({
//             ...tx,
//             id: tx._id.toString(),
//           }))
//           setTransactions(mappedTransactions)
//         }

//         // Load recent Zelle contacts from localStorage
//         const storedContacts = localStorage.getItem("recentZelleContacts")
//         const contacts = storedContacts ? JSON.parse(storedContacts) : []
//         setRecentContacts(contacts)
//       } catch (error: any) {
//         if (error.message !== 'Unauthorized') {
//           console.error("Error fetching data:", error)
//           setError("An error occurred while loading your dashboard")
//         }
//         // Note: If error is 'Unauthorized', apiFetch handles logout
//       }
//     }

//     fetchData()
//   }, [])

//   // Update crypto value when userData or btcPrice changes
//   useEffect(() => {
//     if (userData) {
//       setCryptoValue(userData.cryptoBalance * btcPrice)
//     }
//   }, [userData, btcPrice])

//   // Fetch BTC price every 10 minutes
//   useEffect(() => {
//     const priceInterval = setInterval(async () => {
//       try {
//         const response = await fetch("/api/price")
//         if (!response.ok) throw new Error("Price update failed")
//         const data = await response.json()
//         const newBtcPrice: number = data.bitcoin?.usd || 0
//         setBtcPrice(newBtcPrice)
//       } catch (error: unknown) {
//         console.error("Price update error:", error instanceof Error ? error.message : 'Unknown error')
//       }
//     }, 600000) // 10 minutes = 600,000 ms

//     return () => clearInterval(priceInterval)
//   }, [])

//   const getTransactionIcon = (type: string) => {
//     switch (type) {
//       case "deposit":
//       case "interest":
//         return <ArrowDown className="h-5 w-5 text-green-600" />
//       case "withdrawal":
//         return <ArrowUp className="h-5 w-5 text-red-600" />
//       case "transfer":
//         return <Send className="h-5 w-5 text-primary-600" />
//       case "payment":
//         return <CreditCard className="h-5 w-5 text-orange-600" />
//       case "fee":
//         return <FileText className="h-5 w-5 text Bauch-600" />
//       case "refund":
//         return <RefreshCcw className="h-5 w-5 text-yellow-600" />
//       case "crypto_buy":
//       case "crypto_sell":
//       case "bitcoin_transfer":
//         return <CreditCard className="h-5 w-5 text-purple-600" />
//       default:
//         return <CreditCard className="h-5 w-5 text-gray-600" />
//     }
//   }

//   return (
//     <div className="flex min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
//       {/* Mobile Navigation */}
//       <Sheet>
//         <SheetTrigger asChild>
//           <Button
//             variant="outline"
//             size="icon"
//             className="md:hidden fixed top-4 left-4 z-40 bg-white shadow-md border-primary-200"
//           >
//             <Menu className="h-5 w-5 text-primary-600" />
//           </Button>
//         </SheetTrigger>
//         <SheetContent side="left" className="p-0 w-64">
//           <div className="flex h-full flex-col bg-gradient-to-br from-primary-800 to-secondary-900 text-white">
//             <div className="p-4 border-b border-primary-700 bg-gradient-to-r from-primary-900 to-secondary-950">
//               <div className="flex items-center gap-2">
//                 {settings?.logoUrl ? (
//                   <img
//                     src={settings.logoUrl}
//                     alt="Site Logo"
//                     style={{
//                       width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
//                       height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '32px',
//                       filter: 'brightness(100%)',
//                     }}
//                   />
//                 ) : (
//                   <div style={{ height: '32px' }}></div>
//                   // <img
//                   //   src="/zelle-logo.svg"
//                   //   alt="Zelle"
//                   //   style={{ width: 'auto', height: '32px', filter: 'brightness(100%)' }}
//                   // />
//                 )}
//               </div>
//             </div>
//             <nav className="flex-1 overflow-auto py-2">
//               <div className="px-3 py-2">
//                 <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Main</h2>
//                 <div className="space-y-1">
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard">
//                       <Home className="mr-2 h-4 w-4" />
//                       Dashboard
//                     </Link>
//                   </Button>
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard/accounts">
//                       <CreditCard className="mr-2 h-4 w-4" />
//                       Accounts
//                     </Link>
//                   </Button>
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard/transactions">
//                       <FileText className="mr-2 h-4 w-4" />
//                       Transactions
//                     </Link>
//                   </Button>
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard/transfers">
//                       <Send className="mr-2 h-4 w-4" />
//                       Transfers
//                     </Link>
//                   </Button>
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard/crypto">
//                       <ArrowUpRight className="mr-2 h-4 w-4" />
//                       Crypto
//                     </Link>
//                   </Button>
//                 </div>
//               </div>
//               <div className="px-3 py-2">
//                 <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
//                 <div className="space-y-1">
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
//                     <Link href="/dashboard/profile">
//                       <User className="mr-2 h-4 w-4" />
//                       Profile
//                     </Link>
//                   </Button>
//                   <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={logout}>
//                     <LogOut className="mr-2 h-4 w-4" />
//                     Logout
//                   </Button>
//                 </div>
//               </div>
//             </nav>
//           </div>
//         </SheetContent>
//       </Sheet>

//       {/* Desktop Sidebar */}
//       <div className="hidden md:flex border-r bg-gradient-to-br from-primary-800 to-secondary-900 text-white w-64 flex-col fixed inset-y-0">
//         <div className="p-4 border-b border-primary-600 bg-gradient-to-r from-primary-900 to-secondary-950">
//           <div className="flex items-center gap-2">
//             {settings?.logoUrl ? (
//               <img
//                 src={settings.logoUrl}
//                 alt="Site Logo"
//                 style={{
//                   width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
//                   height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '32px',
//                   filter: 'brightness(100%)',
//                 }}
//               />
//             ) : (
//               <div style={{ height: '32px' }}></div>
//               // <img
//               //   src="/zelle-logo.svg"
//               //   alt="Zelle"
//               //   style={{ width: 'auto', height: '32px', filter: 'brightness(100%)' }}
//               // />
//             )}
//           </div>
//         </div>
//         <nav className="flex-1 overflow-auto py-4">
//           <div className="px-3 py-2">
//             <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Main</h2>
//             <div className="space-y-1">
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard">
//                   <Home className="mr-2 h-4 w-4" />
//                   Dashboard
//                 </Link>
//               </Button>
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard/accounts">
//                   <CreditCard className="mr-2 h-4 w-4" />
//                   Accounts
//                 </Link>
//               </Button>
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard/transactions">
//                   <FileText className="mr-2 h-4 w-4" />
//                   Transactions
//                 </Link>
//               </Button>
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard/transfers">
//                   <Send className="mr-2 h-4 w-4" />
//                   Transfers
//                 </Link>
//               </Button>
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard/crypto">
//                   <ArrowUpRight className="mr-2 h-4 w-4" />
//                   Crypto
//                 </Link>
//               </Button>
//             </div>
//           </div>
//           <div className="px-3 py-2">
//             <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
//             <div className="space-y-1">
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" asChild>
//                 <Link href="/dashboard/profile">
//                   <User className="mr-2 h-4 w-4" />
//                   Profile
//                 </Link>
//               </Button>
//               <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/50" onClick={logout}>
//                 <LogOut className="mr-2 h-4 w-4" />
//                 Logout
//               </Button>
//             </div>
//           </div>
//         </nav>
//       </div>

//       {/* Main Content */}
//       <div className="md:pl-64 flex-1 flex flex-col">
//         <header className="bg-white border-b border-primary-100 h-16 sticky top-0 z-30 flex items-center shadow-sm">
//           <div className="flex-1 px-6 pl-14 md:pl-6">
//             <h1 className="text-xl font-bold md:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700">
//               Dashboard
//             </h1>
//           </div>
//           <div className="flex items-center gap-4 px-6">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>

//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuLabel>My Account</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem asChild>
//                   <Link href="/dashboard/profile">
//                     <User className="mr-2 h-4 w-4" />
//                     <span>Profile</span>
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem asChild>
//                   <Link href="/dashboard/accounts">
//                     <CreditCard className="mr-2 h-4 w-4" />
//                     <span>Accounts</span>
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={logout}>
//                   <LogOut className="mr-2 h-4 w-4" />
//                   <span>Logout</span>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </header>
//         <main className="p-4 sm:p-6 flex-1">
//           <h1 className="text-2xl font-bold mb-6 hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
//             Dashboard
//           </h1>

//           {error && (
//             <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
//               {error}
//             </div>
//           )}

//           {/* Account Cards */}
//           <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
//             <div className="relative group h-full">
//               <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
//               <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-medium text-primary-600">Checking Account</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex-grow">
//                   <div className="text-2xl font-bold">${(userData?.checkingBalance || 0)}</div>
//                   <p className="text-xs text-primary-500">Account #: xxxx-xxxx-4582</p>
//                 </CardContent>
//                 <div className="p-4 pt-0 mt-auto">
//                   <div className="flex space-x-2">
//                     <Button
//                       size="sm"
//                       className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
//                       asChild
//                     >
//                       <Link href="/dashboard/transfers">Send Money</Link>
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       className="border-primary-200 text-primary-600 hover:bg-primary-50"
//                       asChild
//                     >
//                       <Link href="/dashboard/accounts">Details</Link>
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             </div>



//             <div className="relative group h-full">
//               <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
//               <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-medium text-primary-600">Savings Account</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex-grow">
//                   <div className="text-2xl font-bold">${(userData?.savingsBalance || 0)}</div>
//                   <p className="text-xs text-primary-500">Account #: xxxx-xxxx-4583</p>
//                 </CardContent>
//                 <div className="p-4 pt-0 mt-auto">
//                   <div className="flex space-x-2">
//                     <Button
//                       size="sm"
//                       className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
//                       asChild
//                     >
//                       <Link href="/dashboard/transfers">Send Money</Link>
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       className="border-primary-200 text-primary-600 hover:bg-primary-50"
//                       asChild
//                     >
//                       <Link href="/dashboard/accounts">Details</Link>
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             </div>

//             <div className="relative group h-full">
//               <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
//               <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-medium text-amber-600">Bitcoin Wallet</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex-grow">
//                   <div className="text-2xl font-bold">{(userData?.cryptoBalance || 0).toFixed(6)} BTC</div>
//                   <p className="text-xs text-amber-500">
//                     ≈ ${formatPrice(Math.abs(cryptoValue))} (${formatPrice(Math.abs(btcPrice))}/BTC)
//                   </p>
//                 </CardContent>
//                 <div className="p-4 pt-0 mt-auto">
//                   <div className="flex space-x-2">
//                     <Button
//                       size="sm"
//                       className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
//                       asChild
//                     >
//                       <Link href="/dashboard/crypto">Buy/Sell</Link>
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       className="border-amber-200 text-amber-600 hover:bg-amber-50"
//                       asChild
//                     >
//                       <Link href="/dashboard/crypto">Details</Link>
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             </div>
//           </div>

//           {/* Recent Transactions */}
//           <h2 className="text-xl font-bold mb-4 text-primary-800">Recent Transactions</h2>
//           <div className="relative">
//             <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-20"></div>
//             <Card className="relative border-0 shadow-lg">
//               <CardContent className="p-0">
//                 <div className="divide-y divide-primary-100">
//                   {transactions.slice(0, 5).map((transaction) => (
//                     <div
//                       key={transaction.id}
//                       className="flex items-center justify-between p-4 hover:bg-primary-50 transition-colors"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="h-10 w-10 rounded-full flex items-center justify-center">
//                           {getTransactionIcon(transaction.type)}
//                         </div>
//                         <div>
//                           <div className="font-medium text-sm sm:text-base">
//                             {transaction.category === "Zelle External"
//                               ? `Zelle - ${transaction.zellePersonInfo.recipientName}`
//                                 : transaction.description}
//                           </div>
//                           <div className="text-xs text-primary-500">
//                             {formatDate(transaction.date)}
//                             {transaction.category === "Zelle External" ? ` - ${transaction.description}` : ""}
//                           </div>
//                         </div>
//                       </div>
//                       {transaction.accountType === "crypto" ? (
//                         <div className={`font-bold text-sm sm:text-base ${transaction.cryptoAmount && transaction.cryptoAmount > 0 ? "text-emerald-600" : "text-red-600"
//                           }`}
//                         >
//                           {/* {transaction.cryptoAmount && transaction.cryptoAmount > 0 ? "+" : ""} */}
//                           {transaction.cryptoAmount ? Math.abs(transaction.cryptoAmount).toFixed(6) + " BTC" : ""}
//                         </div>
//                       ) : (
//                         <div className={`font-bold text-sm sm:text-base ${transaction.amount > 0 ? "text-emerald-600" : "text-red-600"
//                           }`}
//                         >
//                           {/* {transaction.amount > 0 ? "+" : "-"} */}
//                           ${formatPrice(Math.abs(transaction.amount))}</div>
//                       )}
//                     </div>
//                   ))}
//                   {transactions.length === 0 && (
//                     <div className="p-4 text-center text-primary-500">
//                       {error ? "Unable to load transactions" : "No recent transactions found."}
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//           <div className="flex justify-center mt-4">
//             <Button
//               variant="outline"
//               className="border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300"
//               asChild
//             >
//               <Link href="/dashboard/transactions">View All Transactions</Link>
//             </Button>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }
