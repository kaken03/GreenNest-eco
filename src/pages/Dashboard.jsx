import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement, 
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import '../css/AdminOrdersDashboard.css'
import AdminOrders from '../components/AdminOrders'
import AdminUsersDashboard from '../components/AdminUsersDashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export function AdminOrdersDashboard() {
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [allOrders, setAllOrders] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('month')
  const [activeView, setActiveView] = useState('orders')
  const [ordersViewMode, setOrdersViewMode] = useState('orders')

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      navigate('/')
      return
    }

    fetchAllOrders()
    fetchAllUsers()
  }, [user, userRole, navigate])

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      // Fetch all orders, sorted by creation date (oldest first - FCFS)
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'))
      const querySnapshot = await getDocs(q)
      const ordersList = []

      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setAllOrders(ordersList)
      setError('')
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      })

      // Update local state
      setAllOrders(
        allOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Failed to update order status. Please try again.')
    }
  }

  const fetchAllUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const usersList = []

      querySnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setAllUsers(usersList)
      setError('')
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        deleted: true,
        deletedAt: new Date(),
      })

      // Update local state
      setAllUsers(allUsers.filter((user) => user.id !== userId))
      alert('User deleted successfully')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user. Please try again.')
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      })

      // Update local state
      setAllUsers(
        allUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )
      alert(`User role updated to ${newRole === 'admin' ? 'Admin' : 'Customer'}`)
    } catch (err) {
      console.error('Error updating user role:', err)
      alert('Failed to update user role. Please try again.')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getOrdersByTimeframe = () => {
    const now = new Date()
    const grouped = {}

    allOrders.forEach((order) => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
      let key

      if (analyticsTimeframe === 'day') {
        const daysAgo = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        if (daysAgo <= 30) key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (analyticsTimeframe === 'week') {
        const weeksAgo = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24 * 7))
        if (weeksAgo <= 12) {
          const weekStart = new Date(orderDate)
          weekStart.setDate(orderDate.getDate() - orderDate.getDay())
          key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      } else if (analyticsTimeframe === 'month') {
        const monthsAgo = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth())
        if (monthsAgo <= 12) key = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      } else if (analyticsTimeframe === 'year') {
        key = orderDate.getFullYear().toString()
      }

      if (key) {
        if (!grouped[key]) grouped[key] = { total: 0, pending: 0, confirmed: 0, ready_for_pickup: 0, completed: 0, cancelled: 0 }
        grouped[key].total++
        grouped[key][order.status] = (grouped[key][order.status] || 0) + 1
      }
    })

    return Object.entries(grouped).sort()
  }

  const analyticsData = getOrdersByTimeframe()

  const getProductStats = () => {
    const productMap = {}
    let totalProducts = 0

    allOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const productName = item.name || 'Unknown Product'
        if (!productMap[productName]) productMap[productName] = 0
        const quantity = item.quantity || 1
        productMap[productName] += quantity
        totalProducts += quantity
      })
    })

    return { productMap, totalProducts }
  }

  const { productMap, totalProducts } = getProductStats()

  const barChartData = {
    labels: analyticsData.map(([period]) => period),
    datasets: [
      { label: 'Total Orders', data: analyticsData.map(([, data]) => data.total), backgroundColor: '#007bff', borderColor: '#0056b3', borderWidth: 1 },
      { label: 'Completed', data: analyticsData.map(([, data]) => data.completed), backgroundColor: '#28a745', borderColor: '#218838', borderWidth: 1 },
      { label: 'Pending', data: analyticsData.map(([, data]) => data.pending), backgroundColor: '#ffc107', borderColor: '#ff9800', borderWidth: 1 },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: `Orders Over Time (${analyticsTimeframe.charAt(0).toUpperCase() + analyticsTimeframe.slice(1)})` } },
    scales: { y: { beginAtZero: true } },
  }

  const pieChartData = { labels: Object.keys(productMap), datasets: [{ data: Object.values(productMap), backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'], borderColor: '#fff', borderWidth: 2 }] }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.parsed
            const percentage = ((value / totalProducts) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
      title: { display: true, text: 'Products Ordered Distribution' },
    },
  }

  const filteredOrders = filterStatus === 'all' ? allOrders : allOrders.filter((o) => o.status === filterStatus)

  const stats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
    ready_for_pickup: allOrders.filter((o) => o.status === 'ready_for_pickup').length,
    completed: allOrders.filter((o) => o.status === 'completed').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
  }

  const userStats = {
    total: allUsers.filter(u => !u.deleted).length,
    customers: allUsers.filter(u => u.role === 'user' && !u.deleted).length,
    admins: allUsers.filter(u => u.role === 'admin' && !u.deleted).length,
  }

  return (
    <div className="admin-orders-page">
      
      <div className="admin-orders-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="dashboard-nav-tabs">
            <button 
              className={`nav-tab ${activeView === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveView('orders')}
            >
              Orders Management
            </button>
            <button 
              className={`nav-tab ${activeView === 'users' ? 'active' : ''}`}
              onClick={() => setActiveView('users')}
            >
              Users Management
            </button>
          </div>
        </div>

        {activeView === 'orders' && (
          <AdminOrders
            loading={loading}
            error={error}
            filteredOrders={filteredOrders}
            stats={stats}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            updateOrderStatus={updateOrderStatus}
            formatDate={formatDate}
            activeView={ordersViewMode}
            setActiveView={setOrdersViewMode}
            analyticsTimeframe={analyticsTimeframe}
            setAnalyticsTimeframe={setAnalyticsTimeframe}
            analyticsData={analyticsData}
            productMap={productMap}
            totalProducts={totalProducts}
            barChartData={barChartData}
            barChartOptions={barChartOptions}
            pieChartData={pieChartData}
            pieChartOptions={pieChartOptions}
          />
        )}

        {activeView === 'users' && (
          <AdminUsersDashboard
            loading={loading}
            error={error}
            allUsers={allUsers.filter(u => !u.deleted)}
            stats={userStats}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            handleDeleteUser={handleDeleteUser}
            handleChangeRole={handleChangeRole}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  )
}
