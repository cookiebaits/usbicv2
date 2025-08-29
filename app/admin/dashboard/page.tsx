"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, Home, LogOut, Plus, Settings, Users, Loader, User, AlertCircle, MoreHorizontal, Globe, ArrowDown, ArrowUp, FileText, RefreshCcw, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLogo } from "@/app/logoContext"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateTime, formatPrice, formatDate, fetchColors } from "@/lib/utils"
import { FaBitcoinSign } from "react-icons/fa6"
import { useZelleLogo } from "@/app/zellLogoContext"
import { useTopBarHeight } from "@/app/TopBarContext"
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";

interface User {
  id: string
  name: string
  username: string
  email: string
  accountNumber: string
  balance: number
  status: "pending" | "active" | "suspended"
  twoFactorEnabled: boolean
  lastLogin: string
  savingsBalance?: number
  cryptoBalance?: number
}

interface Transaction {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  amount: number
  description: string
  date: string
  status: string
  account: string
  memo?: string
  transferId?: string
  category?: string
  accountType?: string
  cryptoAmount?: number
  cryptoPrice?: number
  recipientWallet?: string
  zellePersonInfo?: {
    recipientName: string
    recipientType: string
    recipientValue: string
  }
}

interface PendingUser {
  _id: string
  fullName: string
  username: string
  email: string
  phone: string
  ssn: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

interface Colors {
  primaryColor: string
  secondaryColor: string
}

export const TransactionEditModal = ({
  transaction,
  open,
  onOpenChange,
  onUpdate,
}: {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => Promise<void>
}) => {
  const [form, setForm] = useState({
    description: transaction.description,
    memo: transaction.memo || "",
    amount: transaction.amount,
    cryptoAmount: transaction.cryptoAmount || 0,
    cryptoPrice: transaction.cryptoPrice || 0,
    recipientWallet: transaction.recipientWallet || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const body: any = {
        description: form.description,
        memo: form.memo,
        amount: form.amount,
        status: transaction.status,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
      }
      if (transaction.cryptoAmount !== undefined) {
        body.cryptoAmount = form.cryptoAmount
      }
      if (transaction.cryptoPrice !== undefined) {
        body.cryptoPrice = form.cryptoPrice
      }
      if (transaction.type === "bitcoin_transfer") {
        body.recipientWallet = form.recipientWallet
      }
      const res = await fetch(`/api/admin/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update transaction")
      }
      onOpenChange(false)
      await onUpdate()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md bg-white/95 backdrop-blur-sm border border-primary-100">
        <DialogHeader>
          <DialogTitle className="text-primary-900">Quick Edit Transaction</DialogTitle>
          <DialogDescription className="text-primary-600">
            Edit main details of the transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 px-2 sm:px-0">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-primary-800">
              Description
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={handleChange}
              name="description"
              className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-primary-800">
              Memo
            </Label>
            <Input
              id="memo"
              value={form.memo}
              onChange={handleChange}
              name="memo"
              className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            />
          </div>
          {transaction.amount !== 0 && (
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-primary-800">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                name="amount"
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          )}
          {transaction.cryptoAmount !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="cryptoAmount" className="text-primary-800">
                Crypto Amount (BTC)
              </Label>
              <Input
                id="cryptoAmount"
                type="number"
                step="0.00000001"
                value={form.cryptoAmount}
                onChange={handleChange}
                name="cryptoAmount"
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          )}
          {transaction.cryptoPrice !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="cryptoPrice" className="text-primary-800">
                Crypto Price (USD)
              </Label>
              <Input
                id="cryptoPrice"
                type="number"
                step="0.01"
                value={form.cryptoPrice}
                onChange={handleChange}
                name="cryptoPrice"
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          )}
          {transaction.type === "bitcoin_transfer" && (
            <div className="space-y-2">
              <Label htmlFor="recipientWallet" className="text-primary-800">
                Recipient Wallet
              </Label>
              <Input
                id="recipientWallet"
                value={form.recipientWallet}
                onChange={handleChange}
                name="recipientWallet"
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { logoUrl } = useLogo()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userTransactions, setUserTransactions] = useState<Map<string, Transaction[]>>(new Map())
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalBalance: 0,
    transactionsToday: 0,
  })
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false)
  const [isCryptoDialogOpen, setIsCryptoDialogOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState<{
    userId: string
    type: Transaction["type"]
    amount: string
    description: string
  }>({
    userId: "",
    type: "deposit",
    amount: "",
    description: "",
  })
  const [cryptoForm, setCryptoForm] = useState({
    cryptoAmount: "",
    cryptoPrice: "",
  })
  const [isPendingApprovalsOpen, setIsPendingApprovalsOpen] = useState<boolean>(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})
  const { zelleLogoUrl } = useZelleLogo();
  const topBarHeight = useTopBarHeight();
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [isUserSelectionOpen, setIsUserSelectionOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUserSelect = (userId: string) => {
    setIsUserSelectionOpen(false)
    router.push(`/admin/users/${userId}?from=dashboard`)
  }

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  useEffect(() => {

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

  const fetchDashboardData = async () => {
    try {
      const usersRes = await fetch("/api/admin/users", { credentials: "include" })
      if (!usersRes.ok) throw new Error("Failed to fetch users")
      const usersData = await usersRes.json()
      const usersArray: User[] = usersData.users || []

      const transactionsRes = await fetch("/api/admin/transactions", { credentials: "include" })
      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions")
      const transactionsData = await transactionsRes.json()
      let transactionsArray: Transaction[] = transactionsData.transactions || []
      transactionsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const pendingRes = await fetch("/api/admin/pending-users", { credentials: "include" })
      if (!pendingRes.ok) {
        const errorData = await pendingRes.json()
        throw new Error(errorData.error || "Failed to fetch pending users")
      }
      const pendingData = await pendingRes.json()
      const pendingUsersArray: PendingUser[] = (pendingData.pendingUsers || []).filter(
        (user: PendingUser) => user._id && typeof user._id === "string"
      )

      if (pendingUsersArray.length !== pendingData.pendingUsers.length) {
        console.warn(
          "Some pending users were filtered out due to invalid _id:",
          pendingData.pendingUsers
        )
      }

      setUsers(usersArray)
      setTransactions(transactionsArray)
      setPendingUsers(pendingUsersArray)
      setStats({
        totalUsers: usersArray.length,
        pendingApprovals: pendingUsersArray.length,
        totalBalance: usersArray.reduce((sum, user) => sum + user.balance, 0),
        transactionsToday: transactionsArray.filter(
          (txn) => new Date(txn.date).toDateString() === new Date().toDateString()
        ).length,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/admin/login")
          return
        }

        setIsAuthenticated(true)
        await fetchDashboardData()
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/admin/login")
      } finally {
        setIsLoadingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const map = new Map<string, Transaction[]>()
    transactions.forEach((tx) => {
      if (!map.has(tx.userId)) {
        map.set(tx.userId, [])
      }
      map.get(tx.userId)!.push(tx)
    })
    map.forEach((list) => {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
    setUserTransactions(map)
  }, [transactions])

  const scams = async () => {
    setTransactionError(null)
    if (!newTransaction.userId || !newTransaction.amount || !newTransaction.description) {
      setTransactionError("Please fill in all fields")
      return
    }
    const amount = Number.parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount === 0) {
      setTransactionError("Please enter a valid amount")
      return
    }
    if (newTransaction.type === "withdrawal") {
      const selectedUser = users.find((user) => user.id === newTransaction.userId)
      if (selectedUser) {
        const withdrawalAmount = Math.abs(amount)
        if (selectedUser.balance < withdrawalAmount) {
          setTransactionError(
            `User account doesn't have sufficient funds. Total balance: $${formatPrice(selectedUser.balance)}`
          )
          return
        }
      }
    }
    if (["crypto_buy", "crypto_sell"].includes(newTransaction.type)) {
      setIsCryptoDialogOpen(true)
      return
    }
    try {
      const response = await fetch(`/api/admin/users/${newTransaction.userId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: newTransaction.type,
          amount,
          description: newTransaction.description,
          category: "admin",
          accountType: "checking",
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add transaction")
      }
      setNewTransaction({ userId: "", type: "deposit", amount: "", description: "" })
      setTransactionError(null)
      setIsAddTransactionOpen(false)
      await fetchDashboardData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add transaction"
      setTransactionError(errorMessage)
    }
  }

  console.log(users);

  const handleCryptoTransaction = async () => {
    setTransactionError(null)
    const amount = Number.parseFloat(newTransaction.amount)
    const cryptoAmount = Number.parseFloat(cryptoForm.cryptoAmount)
    const cryptoPrice = Number.parseFloat(cryptoForm.cryptoPrice)
    if (!newTransaction.amount || !newTransaction.description) {
      setTransactionError("Please fill in all transaction fields")
      return
    }
    if (isNaN(amount) || amount === 0) {
      setTransactionError("Please enter a valid amount")
      return
    }
    if (!cryptoForm.cryptoAmount || isNaN(cryptoAmount) || cryptoAmount <= 0) {
      setTransactionError("Please enter a valid crypto amount")
      return
    }
    if (!cryptoForm.cryptoPrice || isNaN(cryptoPrice) || cryptoPrice <= 0) {
      setTransactionError("Please enter a valid crypto price")
      return
    }
    try {
      const response = await fetch(`/api/admin/users/${newTransaction.userId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: newTransaction.type,
          amount,
          description: newTransaction.description,
          category: "admin",
          accountType: "crypto",
          cryptoAmount,
          cryptoPrice,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add transaction")
      }
      setNewTransaction({ userId: "", type: "deposit", amount: "", description: "" })
      setCryptoForm({ cryptoAmount: "", cryptoPrice: "" })
      setTransactionError(null)
      setIsAddTransactionOpen(false)
      setIsCryptoDialogOpen(false)
      await fetchDashboardData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add transaction"
      setTransactionError(errorMessage)
    }
  }

  const handleApproveUser = async (pendingUserId: string) => {
    if (!pendingUserId || typeof pendingUserId !== "string") {
      console.error("Invalid pendingUserId:", pendingUserId)
      setApprovalError("Invalid user ID. Please try again.")
      return
    }

    console.debug("Approving user with ID:", pendingUserId)
    setLoadingActions((prev) => ({ ...prev, [pendingUserId]: true }))
    setApprovalError(null)

    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.error || "Failed to approve user"
        console.error("Approval API error:", errorMessage, { pendingUserId })
        throw new Error(errorMessage)
      }

      const approvedUserData = await response.json()
      const approvedUser = pendingUsers.find((u) => u._id === pendingUserId)
      if (approvedUser) {
        const newUser: User = {
          id: pendingUserId,
          name: approvedUser.fullName,
          username: approvedUser.username || "N/A",
          email: approvedUser.email,
          accountNumber: approvedUserData.accountNumber || "N/A",
          balance: 0,
          status: "active",
          twoFactorEnabled: true,
          lastLogin: "N/A",
        }
        setUsers((prev) => [...prev, newUser])
        setPendingUsers((prev) => prev.filter((user) => user._id !== pendingUserId))
        setStats((prev) => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1,
          totalUsers: prev.totalUsers + 1,
          totalBalance: prev.totalBalance + newUser.balance,
        }))
      } else {
        console.warn("Approved user not found in pendingUsers:", pendingUserId)
        const pendingRes = await fetch("/api/admin/pending-users", { credentials: "include" })
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingUsers(pendingData.pendingUsers || [])
          setStats((prev) => ({
            ...prev,
            pendingApprovals: (pendingData.pendingUsers || []).length,
          }))
        }
      }
    } catch (error) {
      console.error("Error approving user:", error)
      const errorMessage =
        error instanceof Error && error.message === "User not found"
          ? "User not found. They may have been already approved or removed."
          : error instanceof Error
            ? error.message
            : "Failed to approve user"
      setApprovalError(errorMessage)

      try {
        const pendingRes = await fetch("/api/admin/pending-users", { credentials: "include" })
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingUsers(pendingData.pendingUsers || [])
          setStats((prev) => ({
            ...prev,
            pendingApprovals: (pendingData.pendingUsers || []).length,
          }))
        }
      } catch (refreshError) {
        console.error("Error refreshing pending users:", refreshError)
      }
    } finally {
      setLoadingActions((prev) => ({ ...prev, [pendingUserId]: false }))
    }
  }

  const handleRejectUser = async (pendingUserId: string) => {
    setLoadingActions((prev) => ({ ...prev, [pendingUserId]: true }))
    setApprovalError(null)
    try {
      const response = await fetch("/api/admin/reject-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reject user")
      }

      setPendingUsers((prev) => prev.filter((user) => user._id !== pendingUserId))
      setStats((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }))
    } catch (error) {
      console.error("Error rejecting user:", error)
      setApprovalError(error instanceof Error ? error.message : "Failed to reject user")
    } finally {
      setLoadingActions((prev) => ({ ...prev, [pendingUserId]: false }))
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/admin/login")
    }
  }

  const getTransactionIcon = (type: string, category?: string, accountType?: string) => {

    if (category === "admin" && accountType === "crypto")
      return <FaBitcoinSign className="h-5 w-5 text-yellow-500" />
    switch (type) {
      case "deposit":
      case "interest":
      case "withdrawal":
      case "transfer":
      case "payment":
        return <img
          src="/arrow-top-bottom.png"
          alt="Double Arrow Icon"
          className="h-5 w-auto"
        />
      case "fee":
        return <FileText className="h-5 w-5 text-indigo-600" />
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />
      case "crypto_buy":
      case "crypto_sell":
      case "bitcoin_transfer":
        return <FaBitcoinSign className="h-5 w-5 text-yellow-500" />
      case "zelle":
        return <img
          src="/zellez.png"
          alt="Zelle Logo"
          className="h-5 w-auto"
        />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50">

      <div className="flex min-h-screen w-[1300px] m-auto relative">
        <div className="hidden md:flex text-white w-64 flex-col fixed inset-y-0 mt-6" style={{ top: `${topBarHeight}px` }}>
          <nav className="flex-1 overflow-auto py-4">
            <div className="px-3 py-2">
              <h2 className="mb-4 px-4 text-sm font-semibold tracking-tight text-black">Dashboard</h2>
              <div className="space-y-4">
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/dashboard">
                    <Home className="mr-1 h-4 w-4" />
                    Overview
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/users">
                    <Users className="mr-1 h-4 w-4" />
                    Users
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/transactions">
                    <CreditCard className="mr-1 h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
              </div>
            </div>
            <div className="px-3 py-2 pt-4">
              <h2 className="mb-4 px-4 text-sm font-semibold tracking-tight text-black">Settings</h2>
              <div className="space-y-4">
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/profile">
                    <User className="mr-1 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-1 h-4 w-4" />
                    Site Settings
                  </Link>
                </Button>
                <Button variant="ghost" className="w-[90%] justify-start text-black hover:bg-black/5 text-base" asChild>
                  <Link href="/admin/iplogs">
                    <Globe className="mr-1 h-4 w-4" />
                    IP Logs
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-[90%] justify-start text-black hover:bg-black/5 text-base"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </nav>
        </div>

        <div className="md:pl-64 flex flex-1 flex-col overflow-hidden">
          <main className="pb-10 sm:pt-10 flex-1">
            <h2 className="text-3xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="backdrop-blur-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-800">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-primary-900">{stats.totalUsers}</div>
                  <p className="text-xs text-primary-700">{stats.pendingApprovals} pending approval</p>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-800">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-primary-900">${formatPrice(stats.totalBalance)}</div>
                  <p className="text-xs text-primary-700">Across all accounts</p>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-800">Transactions Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-primary-900">{stats.transactionsToday}</div>
                  <p className="text-xs text-primary-700">{formatDate(new Date())}</p>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
                    onClick={() => setIsUserSelectionOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Transaction
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
                    onClick={() => setIsPendingApprovalsOpen(true)}
                  >
                    Approvals
                  </Button>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Account Overview
            </h2>
            <Card className="mb-6 sm:mb-8 backdrop-blur-sm bg-white">
              <CardContent className="p-0">
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-primary-50/50">
                        <th className="text-left p-2 sm:p-4 text-primary-800">User</th>
                        <th className="text-left p-2 sm:p-4 text-primary-800 hidden md:table-cell">Account #</th>
                        <th className="text-right p-2 sm:p-4 text-primary-800">Balance</th>
                        <th className="text-center p-2 sm:p-4 text-primary-800 hidden sm:table-cell">Status</th>
                        <th className="text-left p-2 sm:p-4 text-primary-800 hidden lg:table-cell">Last Login</th>
                        <th className="text-center p-2 sm:p-4 text-primary-800 hidden md:table-cell">2FA</th>
                        <th className="text-center p-2 sm:p-4 text-primary-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-100">
                      {users.map((user) => {
                        const expanded = expandedUsers.has(user.id)
                        const recentTx = userTransactions.get(user.id)?.slice(0, 5) || []
                        console.log(recentTx);
                        return (
                          <>
                            <tr
                              key={user.id}
                              className="hover:bg-primary-50 transition-colors cursor-pointer"
                              onClick={() => toggleExpand(user.id)}
                            >
                              <td className="p-2 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary-100">
                                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                                      {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm text-primary-900">{user.name}</div>
                                    <div className="text-xs text-primary-600 hidden sm:block">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 font-mono text-xs hidden md:table-cell text-primary-700">
                                {user.accountNumber}
                              </td>
                              <td className="p-2 sm:p-4 text-right font-medium text-sm text-primary-900">
                                ${formatPrice(user.balance)}
                              </td>
                              <td className="p-2 sm:p-4 text-center hidden sm:table-cell">
                                <Badge
                                  variant={
                                    user.status === "active"
                                      ? "default"
                                      : user.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className={
                                    user.status === "active"
                                      ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                      : user.status === "pending"
                                        ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                                        : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                                  }
                                >
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="p-2 sm:p-4 text-xs hidden lg:table-cell text-primary-700">
                                {formatDateTime(user.lastLogin)}
                              </td>
                              <td className="p-2 sm:p-4 text-center hidden md:table-cell">
                                <Badge
                                  variant="outline"
                                  className={
                                    user.twoFactorEnabled
                                      ? "bg-green-50 text-green-600 border-green-200"
                                      : "bg-gray-50 text-gray-600 border-gray-200"
                                  }
                                >
                                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </td>
                              <td className="p-2 sm:p-4 text-center flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link href={`/admin/users/${user.id}?from=dashboard`}>Manage</Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {expanded ? (
                                  <IoIosArrowDropup className="h-5 w-5" />
                                ) : (
                                  <IoIosArrowDropdown className="h-5 w-5" />
                                )}
                              </td>
                            </tr>
                            {expanded && (
                              <tr>
                                <td colSpan={7} className="p-0">
                                  <div
                                    className="overflow-hidden transition-all duration-300 ease-in-out"
                                    style={{ maxHeight: expanded ? "500px" : "0px" }}
                                  >
                                    <div className="p-4 bg-gray-50">
                                      <h3 className="text-sm font-semibold mb-2 text-primary-800">Recent Transactions</h3>
                                      {recentTx.length > 0 ? (
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b bg-primary-50/50">
                                              <th className="text-left p-2">Date</th>
                                              <th className="text-left p-2">Description</th>
                                              <th className="text-right p-2">Amount</th>
                                              <th className="text-center p-2">Action</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-primary-100">
                                            {recentTx.map((tx) => (
                                              <tr key={tx.id}>
                                                <td className="p-2">{formatDate(tx.date)}</td>
                                                <td className="p-2">
                                                  <div className="flex items-center gap-2 max-w-[670px]">
                                                    {getTransactionIcon(tx.type, tx.category, tx.accountType)}
                                                    {tx.description}
                                                  </div>
                                                </td>
                                                <td className="p-2 text-right">
                                                  {tx.accountType === "crypto" && tx.cryptoAmount ? (
                                                    <span>{tx.cryptoAmount.toFixed(8)} BTC</span>
                                                  ) : (
                                                    <span>${formatPrice(Math.abs(tx.amount))}</span>
                                                  )}
                                                </td>
                                                <td className="p-2 text-center">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedTransaction(tx)}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p className="text-sm text-primary-600">No recent transactions</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden divide-y divide-primary-100">
                  {users.map((user) => {
                    const expanded = expandedUsers.has(user.id)
                    const recentTx = userTransactions.get(user.id)?.slice(0, 5) || []
                    return (
                      <div key={user.id} className="p-4 hover:bg-primary-50/50 transition-colors">
                        <div
                          className="flex items-center justify-between mb-2 cursor-pointer"
                          onClick={() => toggleExpand(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-primary-100">
                              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm text-primary-900">
                                {user.name}
                                {expanded ? (
                                  <ArrowUp className="inline h-4 w-4 ml-2 text-primary-600" />
                                ) : (
                                  <ArrowDown className="inline h-4 w-4 ml-2 text-primary-600" />
                                )}
                              </div>
                              <div className="text-xs text-primary-600">{user.email}</div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}?from=dashboard`}>Manage</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-primary-500">Account #:</span>{" "}
                            <span className="font-mono">{user.accountNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-primary-500">Balance:</span>{" "}
                            <span className="font-medium">${formatPrice(user.balance)}</span>
                          </div>
                          <div>
                            <span className="text-primary-500">Status:</span>{" "}
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : user.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                user.status === "active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : user.status === "pending"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {user.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-primary-500">2FA:</span>{" "}
                            <Badge
                              variant="outline"
                              className={
                                user.twoFactorEnabled
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }
                            >
                              {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                        {expanded && (
                          <div
                            className="overflow-hidden transition-all duration-300 ease-in-out mt-4"
                            style={{ maxHeight: expanded ? "500px" : "0px" }}
                          >
                            <div className="bg-gray-50 p-4 rounded">
                              <h3 className="text-sm font-semibold mb-2 text-primary-800">Recent Transactions</h3>
                              {recentTx.length > 0 ? (
                                <div className="space-y-4">
                                  {recentTx.map((tx) => (
                                    <div key={tx.id} className="flex flex-col gap-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        {getTransactionIcon(tx.type, tx.category, tx.accountType)}
                                        <span>{tx.description}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>{formatDate(tx.date)}</span>
                                        <span>
                                          {tx.accountType === "crypto" && tx.cryptoAmount ? (
                                            `${tx.cryptoAmount.toFixed(8)} BTC`
                                          ) : (
                                            `$${formatPrice(Math.abs(tx.amount))}`
                                          )}
                                        </span>
                                      </div>
                                      <div className="text-center mt-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedTransaction(tx)}
                                        >
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-primary-600">No recent transactions</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md bg-white/95 backdrop-blur-sm border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Add New Transaction</DialogTitle>
              <DialogDescription className="text-primary-600">
                Create a new transaction for a user's account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 px-2 sm:px-0">
              {transactionError && (
                <Alert variant="destructive" className="bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{transactionError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="user" className="text-primary-800">
                  Select User
                </Label>
                <Select
                  value={newTransaction.userId}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, userId: value })}
                >
                  <SelectTrigger
                    id="user"
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  >
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionType" className="text-primary-800">
                  Transaction Type
                </Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                >
                  <SelectTrigger
                    id="transactionType"
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  >
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="crypto_buy">Add Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-primary-800">
                  Amount
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">$</div>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    className="pl-7 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>
                <p className="text-sm text-primary-600">
                  Use negative values for withdrawals only that reduce balance.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-primary-800">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Enter transaction description"
                  className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
                onClick={() => {
                  setIsAddTransactionOpen(false)
                  setTransactionError(null)
                  setNewTransaction({ userId: "", type: "deposit", amount: "", description: "" })
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                onClick={scams}
              >
                Add Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCryptoDialogOpen} onOpenChange={setIsCryptoDialogOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md bg-white/95 backdrop-blur-sm border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Crypto Transaction Details</DialogTitle>
              <DialogDescription className="text-primary-600">
                Provide additional details for the {newTransaction.type} transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {transactionError && (
                <Alert variant="destructive" className="bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{transactionError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="cryptoAmount" className="text-primary-800">
                  Crypto Amount (BTC)
                </Label>
                <Input
                  id="cryptoAmount"
                  type="number"
                  step="0.00000001"
                  className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="0.00000000"
                  value={cryptoForm.cryptoAmount}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, cryptoAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cryptoPrice" className="text-primary-800">
                  Crypto Price (USD per BTC)
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">$</div>
                  <Input
                    id="cryptoPrice"
                    type="number"
                    step="0.01"
                    className="pl-7 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="0.00"
                    value={cryptoForm.cryptoPrice}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, cryptoPrice: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCryptoDialogOpen(false)
                  setCryptoForm({ cryptoAmount: "", cryptoPrice: "" })
                  setTransactionError(null)
                }}
                className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCryptoTransaction}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              >
                Submit Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPendingApprovalsOpen} onOpenChange={setIsPendingApprovalsOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-lg bg-white/95 backdrop-blur-sm border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Pending Approvals</DialogTitle>
              <DialogDescription className="text-primary-600">
                Review and approve or reject new user registrations.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {approvalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{approvalError}</AlertDescription>
                </Alert>
              )}
              {pendingUsers.length > 0 ? (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user._id} className="border rounded-lg p-4 space-y-4 bg-white/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary-100">
                            <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-primary-900">{user.fullName}</div>
                            <div className="text-sm text-primary-600">{user.email}</div>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-primary-700">
                          <span className="text-primary-500">Username:</span> {user.username || "Not set"}
                        </div>
                        <div className="text-primary-700">
                          <span className="text-primary-500">Phone:</span> {user.phone}
                        </div>
                        <div className="text-primary-700">
                          <span className="text-primary-500">SSN:</span> {user.ssn}
                        </div>
                        <div className="text-primary-700">
                          <span className="text-primary-500">Address:</span>{" "}
                          {`${user.streetAddress}, ${user.city}, ${user.state} ${user.zipCode}`}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          size="sm"
                          onClick={() => handleRejectUser(user._id)}
                          disabled={loadingActions[user._id]}
                        >
                          {loadingActions[user._id] ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                          onClick={() => handleApproveUser(user._id)}
                          disabled={loadingActions[user._id]}
                        >
                          {loadingActions[user._id] ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-primary-600">No pending approvals</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                onClick={() => {
                  setIsPendingApprovalsOpen(false)
                  setApprovalError(null)
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isUserSelectionOpen} onOpenChange={setIsUserSelectionOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md bg-white/95 backdrop-blur-sm border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Select User</DialogTitle>
              <DialogDescription className="text-primary-600">
                Search and select a user to manage their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <div className="max-h-[300px] overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-primary-50">
                      <div>
                        <div className="font-medium text-primary-900">{user.name}</div>
                        <div className="text-sm text-primary-600">{user.username} - {user.email}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleUserSelect(user.id)}>
                        Select
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-primary-600">No users found</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUserSelectionOpen(false)}
                className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedTransaction && (
          <TransactionEditModal
            transaction={selectedTransaction}
            open={!!selectedTransaction}
            onOpenChange={(open) => {
              if (!open) setSelectedTransaction(null)
            }}
            onUpdate={fetchDashboardData}
          />
        )}
      </div>
    </div>
  )
}