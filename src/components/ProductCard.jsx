import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { ProductDetailsModal } from './ProductDetailsModal'
import '../css/ProductCard.css'

export function ProductCard({ product, onProductUpdated, onEditProduct }) {
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      setDeleting(true)
      await deleteDoc(doc(db, 'products', product.id))
      if (onProductUpdated) {
        onProductUpdated()
      }
    } catch (err) {
      console.error('Error deleting product:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="product-card" onClick={() => userRole !== 'admin' && setShowDetailsModal(true)}>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="product-image" />
        )}
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
        </div>

        {userRole === 'admin' && (
          <div className="admin-actions">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                onEditProduct && onEditProduct(product)
              }}
              title="Edit product"
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteProduct()
              }}
              disabled={deleting}
              title="Delete product"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showDetailsModal}
        product={product}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  )
}
