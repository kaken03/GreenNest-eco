import React, { useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import '../css/AdminOrdersDashboard.css'

export default function AdminOrders({
  loading,
  error,
  filteredOrders,
  stats,
  filterStatus,
  setFilterStatus,
  updateOrderStatus,
  formatDate,
  activeView,
  setActiveView,
  analyticsTimeframe,
  setAnalyticsTimeframe,
  analyticsData,
  productMap,
  totalProducts,
  barChartData,
  barChartOptions,
  pieChartData,
  pieChartOptions,
}) {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedOrder(null)
  }

  return (
    <>
      <div className="view-toggle-section">
        <button
          className={`view-toggle-btn ${activeView === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveView('orders')}
        >
          Orders List
        </button>
        <button
          className={`view-toggle-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeView === 'analytics' && (
        
        <div className="analytics-section">
          <h2>Orders Analytics</h2>

          <div className="analytics-controls">
            <button
              className={`time-filter-btn ${analyticsTimeframe === 'day' ? 'active' : ''}`}
              onClick={() => setAnalyticsTimeframe('day')}
            >
              Day
            </button>
            <button
              className={`time-filter-btn ${analyticsTimeframe === 'week' ? 'active' : ''}`}
              onClick={() => setAnalyticsTimeframe('week')}
            >
              Week
            </button>
            <button
              className={`time-filter-btn ${analyticsTimeframe === 'month' ? 'active' : ''}`}
              onClick={() => setAnalyticsTimeframe('month')}
            >
              Month
            </button>
            <button
              className={`time-filter-btn ${analyticsTimeframe === 'year' ? 'active' : ''}`}
              onClick={() => setAnalyticsTimeframe('year')}
            >
              Year
            </button>
          </div>

          <div className="charts-container">
            <div className="chart-wrapper">
              {analyticsData.length === 0 ? (
                <div className="chart-empty">
                  <p>No data available for this period</p>
                </div>
              ) : (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>

            <div className="chart-wrapper">
              {Object.keys(productMap).length === 0 ? (
                <div className="chart-empty">
                  <p>No products ordered yet</p>
                </div>
              ) : (
                <Pie data={pieChartData} options={pieChartOptions} />
              )}
            </div>
          </div>

          {Object.keys(productMap).length > 0 && (
            <div className="product-stats-summary">
              <h3>Product Order Summary</h3>
              <div className="product-stats-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Quantity Ordered</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(productMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([productName, quantity]) => (
                        <tr key={productName}>
                          <td className="product-name">{productName}</td>
                          <td className="product-quantity">{quantity}</td>
                          <td className="product-percentage">
                            {((quantity / totalProducts) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'orders' && (
        <div className="orders-section">
          <div className="filters-section">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({stats.pending})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('confirmed')}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'ready_for_pickup' ? 'active' : ''}`}
                onClick={() => setFilterStatus('ready_for_pickup')}
              >
                Ready for Pickup ({stats.ready_for_pickup})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed ({stats.completed})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilterStatus('cancelled')}
              >
                Cancelled ({stats.cancelled})
              </button>
            </div>
          </div>

          {loading && <div className="loading">Loading orders...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && filteredOrders.length === 0 && (
            <div className="empty-state">
              <p>No orders found</p>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <div className="orders-list-container">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-card-admin">
                  <div className="order-card-header">
                    <div className="order-info">
                      <span className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="order-customer">{order.userEmail}</span>
                    </div>
                    <span className={`order-status status-${order.status}`}>{order.status}</span>
                  </div>
                  <div className="order-actions3">
                    <button
                      className="action-btn view-details-btn3"
                      onClick={() => handleViewDetails(order)}
                    >
                      View Details
                    </button>

                    {order.status === 'pending' && (
                      <button
                        className="action-btn confirm-btn"
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        Confirm Order
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        className="action-btn ready-btn"
                        onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                      >
                        Ready for Pickup
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && (
                      <button
                        className="action-btn complete-btn"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        Mark Completed
                      </button>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        className="action-btn cancel-btn1"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this order?')) {
                            updateOrderStatus(order.id, 'cancelled')
                          }
                        }}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetailsModal}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="details-sectionnn">
                <div className="detail-item1">
                  <span className="detail-label1">Order ID:</span>
                  <span className="detail-value1">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="detail-item1">
                  <span className="detail-label1">Date:</span>
                  <span className="detail-value1">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="detail-item1">
                  <span className="detail-label1">Status:</span>
                  <span className={`detail-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="items-section">
                <h4 className="section-title">Items Ordered</h4>
                <div className="items-in-modal">
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <div key={index} className="modal-item">
                      <div className="modal-item-info">
                        <span className="modal-item-name">{item.name}</span>
                        <span className="modal-item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="modal-item-subtotal">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider"></div>

              <div className="summary-section">
                <div className="summary-item">
                  <span className="summary-label">Total Amount:</span>
                  <span className="summary-value">₱{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                {selectedOrder.paymentMethod && (
                  <div className="summary-item">
                    <span className="summary-label">Payment Method:</span>
                    <span className="summary-value">{selectedOrder.paymentMethod}</span>
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-close-modal" onClick={handleCloseDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
