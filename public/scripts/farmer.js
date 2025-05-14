// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Set current date
  const currentDate = new Date()
  document.getElementById("currentDate").textContent = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Navigation
  const navItems = document.querySelectorAll(".nav-item")
  const sections = document.querySelectorAll(".section")

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove("active"))

      // Add active class to clicked item
      this.classList.add("active")

      // Show corresponding section
      const sectionId = this.getAttribute("data-section")
      sections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === sectionId) {
          section.classList.add("active")
        }
      })
    })
  })

  // Load dashboard data
  loadDashboardData()

  // Load inventory data
  loadInventoryData()

  // Load orders data
  loadOrdersData()

  // Load payments data
  loadPaymentsData()

  // Product Form Display
  const addProductBtn = document.getElementById("addProductBtn")
  const productForm = document.getElementById("productForm")
  const cancelProductBtn = document.getElementById("cancelProductBtn")

  addProductBtn.addEventListener("click", () => {
    document.getElementById("formTitle").textContent = "Add New Product"
    document.getElementById("addProductForm").reset()
    document.getElementById("productId").value = ""
    productForm.style.display = "block"
  })

  cancelProductBtn.addEventListener("click", () => {
    productForm.style.display = "none"
  })

  // Add Product Form Submission
  const addProductForm = document.getElementById("addProductForm")

  addProductForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const productId = document.getElementById("productId").value
    const name = document.getElementById("productName").value
    const category = document.getElementById("productCategory").value
    const price = document.getElementById("productPrice").value
    const unit = document.getElementById("productUnit").value
    const current_stock = document.getElementById("productStock").value
    const min_stock = document.getElementById("productMinStock").value
    const description = document.getElementById("productDescription").value

    const productData = {
      name,
      category,
      price,
      unit,
      current_stock,
      min_stock,
      description,
    }

    if (productId) {
      // Update existing product
      updateProduct(productId, productData)
    } else {
      // Create new product
      createProduct(productData)
    }
  })

  // Farm Settings Form
  const farmSettingsForm = document.getElementById("farmSettingsForm")

  farmSettingsForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const farmData = {
      farm_name: document.getElementById("farmName").value,
      owner_name: document.getElementById("ownerName").value,
      address: document.getElementById("farmAddress").value,
      email: document.getElementById("contactEmail").value,
      phone: document.getElementById("contactPhone").value,
    }

    // Save farm settings to database
    fetch("/api/farm/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(farmData),
    })
      .then((response) => response.json())
      .then((data) => {
        showToast("Settings saved successfully", "success")
      })
      .catch((error) => {
        console.error("Error saving settings:", error)
        showToast("Failed to save settings", "error")
      })
  })

  // Event delegation for edit and delete buttons in inventory table
  document.getElementById("inventoryTableBody").addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const productId = e.target.getAttribute("data-id")
      getProductById(productId)
    } else if (e.target.classList.contains("delete-btn")) {
      const productId = e.target.getAttribute("data-id")
      if (confirm("Are you sure you want to delete this product?")) {
        deleteProduct(productId)
      }
    }
  })

  // Event delegation for order actions
  document.getElementById("ordersTableBody").addEventListener("click", (e) => {
    if (e.target.classList.contains("accept-btn")) {
      const orderId = e.target.getAttribute("data-id")
      updateOrderStatus(orderId, "Processing")
    } else if (e.target.classList.contains("reject-btn")) {
      const orderId = e.target.getAttribute("data-id")
      if (confirm("Are you sure you want to reject this order?")) {
        updateOrderStatus(orderId, "Rejected")
      }
    } else if (e.target.classList.contains("complete-btn")) {
      const orderId = e.target.getAttribute("data-id")
      updateOrderStatus(orderId, "Completed")
    } else if (e.target.classList.contains("view-btn")) {
      const orderId = e.target.getAttribute("data-id")
      viewOrderDetails(orderId)
    }
  })
})

// API Functions

// Dashboard
function loadDashboardData() {
  // Load dashboard stats
  fetch("/api/dashboard/stats")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalProducts").textContent = data.totalProducts
      document.getElementById("productsChange").textContent = `From ${data.totalCategories} categories`
      document.getElementById("lowStockItems").textContent = data.lowStockItems
      document.getElementById("activeOrders").textContent = data.activeOrders
      document.getElementById("ordersChange").textContent =
        data.activeOrders > 0 ? `${data.activeOrders} need attention` : "All orders fulfilled"
      document.getElementById("totalRevenue").textContent = `$${data.totalRevenue.toFixed(2)}`
    })
    .catch((error) => {
      console.error("Error loading dashboard stats:", error)
      showToast("Failed to load dashboard stats", "error")
    })

  // Load recent orders
  fetch("/api/orders/recent")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("recentOrdersTableBody")
      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No recent orders found</td></tr>'
        return
      }

      data.forEach((order) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${order.order_id}</td>
                  <td>${order.customer}</td>
                  <td>${order.items}</td>
                  <td>$${Number.parseFloat(order.total).toFixed(2)}</td>
                  <td><span class="status-badge badge-${order.status.toLowerCase()}">${order.status}</span></td>
                  <td>${formatDate(order.order_date)}</td>
              `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading recent orders:", error)
      showToast("Failed to load recent orders", "error")
    })
}

// Inventory
function loadInventoryData() {
  fetch("/api/products")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("inventoryTableBody")
      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No products found</td></tr>'
        return
      }

      data.forEach((product) => {
        // Determine stock status
        let status, statusClass
        if (product.current_stock <= 0) {
          status = "Out of Stock"
          statusClass = "status-outofstock"
        } else if (product.current_stock < product.min_stock) {
          status = "Low Stock"
          statusClass = "status-lowstock"
        } else {
          status = "In Stock"
          statusClass = "status-instock"
        }

        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>P${product.id.toString().padStart(3, "0")}</td>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td>$${Number.parseFloat(product.price).toFixed(2)}</td>
                  <td>${product.current_stock} ${product.unit}</td>
                  <td>${product.min_stock} ${product.unit}</td>
                  <td class="${statusClass}">${status}</td>
                  <td>${formatDate(product.last_updated)}</td>
                  <td>
                      <button class="btn btn-primary edit-btn" data-id="${product.id}">Edit</button>
                      <button class="btn btn-danger delete-btn" data-id="${product.id}">Delete</button>
                  </td>
              `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading inventory data:", error)
      showToast("Failed to load inventory data", "error")
    })
}

function getProductById(id) {
  fetch(`/api/products/${id}`)
    .then((response) => response.json())
    .then((product) => {
      document.getElementById("formTitle").textContent = "Edit Product"
      document.getElementById("productId").value = product.id
      document.getElementById("productName").value = product.name
      document.getElementById("productCategory").value = product.category
      document.getElementById("productPrice").value = product.price
      document.getElementById("productUnit").value = product.unit
      document.getElementById("productStock").value = product.current_stock
      document.getElementById("productMinStock").value = product.min_stock
      document.getElementById("productDescription").value = product.description || ""

      document.getElementById("productForm").style.display = "block"
    })
    .catch((error) => {
      console.error("Error getting product:", error)
      showToast("Failed to get product details", "error")
    })
}

function createProduct(productData) {
  fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Product added successfully", "success")
      document.getElementById("productForm").style.display = "none"
      loadInventoryData()
      loadDashboardData()
    })
    .catch((error) => {
      console.error("Error creating product:", error)
      showToast("Failed to add product", "error")
    })
}

function updateProduct(id, productData) {
  fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Product updated successfully", "success")
      document.getElementById("productForm").style.display = "none"
      loadInventoryData()
      loadDashboardData()
    })
    .catch((error) => {
      console.error("Error updating product:", error)
      showToast("Failed to update product", "error")
    })
}

function deleteProduct(id) {
  fetch(`/api/products/${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Product deleted successfully", "success")
      loadInventoryData()
      loadDashboardData()
    })
    .catch((error) => {
      console.error("Error deleting product:", error)
      showToast("Failed to delete product", "error")
    })
}

// Orders
function loadOrdersData() {
  // Load both regular orders and dealer orders
  Promise.all([
    fetch("/api/orders").then((response) => response.json()),
    fetch("/api/dealer/orders/for-farmer").then((response) => response.json()),
  ])
    .then(([regularOrders, dealerOrders]) => {
      // Combine both types of orders
      const allOrders = [...regularOrders, ...dealerOrders]

      // Sort by date (newest first)
      allOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))

      const tableBody = document.getElementById("ordersTableBody")
      tableBody.innerHTML = ""

      if (allOrders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>'
        return
      }

      allOrders.forEach((order) => {
        const row = document.createElement("tr")
        row.setAttribute('data-order-id', order.id)

        // Different action buttons based on order status
        let actionButtons = ""
        if (order.status === "Pending") {
          // For dealer orders, use approveOrder function that updates inventory
          if (order.hasOwnProperty("dealer_id")) {
            actionButtons = `
              <button class="btn btn-primary" data-approve-id="${order.id}" onclick="approveOrder(${order.id})">Approve</button>
              <button class="btn btn-danger" onclick="rejectOrder(${order.id})">Reject</button>
            `
          } else {
            // For regular orders, use the original accept/reject buttons
            actionButtons = `
              <button class="btn btn-primary accept-btn" data-id="${order.id}">Accept</button>
              <button class="btn btn-danger reject-btn" data-id="${order.id}">Reject</button>
            `
          }
        } else if (order.status === "Processing") {
          actionButtons = `
            <button class="btn btn-primary" onclick="shipOrder(${order.id})">Ship</button>
            <button class="btn btn-outline" onclick="viewOrderDetails(${order.id})">View</button>
          `
        } else {
          actionButtons = `
            <button class="btn btn-primary" onclick="viewOrderDetails(${order.id})">View</button>
          `
        }

        // Determine if this is a dealer order
        const isDealer = order.hasOwnProperty("dealer_id")
        const orderType = isDealer ? "Dealer Order" : "Direct Order"
        const orderItems = isDealer ? `${order.product} (${order.quantity} ${order.unit})` : order.items

        row.innerHTML = `
          <td>${order.order_id}</td>
          <td>${order.customer} <span class="badge-${isDealer ? "processing" : "completed"}" style="font-size: 10px; padding: 2px 5px; border-radius: 10px;">${orderType}</span></td>
          <td>${orderItems}</td>
          <td>$${Number.parseFloat(order.total).toFixed(2)}</td>
          <td>${formatDate(order.order_date)}</td>
          <td class="order-status"><span class="status-badge badge-${order.status.toLowerCase()}">${order.status}</span></td>
          <td>${actionButtons}</td>
        `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading orders:", error)
      showToast("Failed to load orders", "error")
    })
}

function updateOrderStatus(orderId, newStatus) {
  // Determine if this is a dealer order (starts with DO-)
  const isDealerOrder = orderId.includes("DO-")
  const endpoint = isDealerOrder ? `/api/dealer/orders/${orderId}/status` : `/api/orders/${orderId}/status`

  fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast(`Order ${newStatus.toLowerCase()} successfully`, "success")
      loadOrdersData()
      loadDashboardData()
    })
    .catch((error) => {
      console.error("Error updating order status:", error)
      showToast("Failed to update order status", "error")
    })
}

// View order details
function viewOrderDetails(orderId) {
  // Determine if this is a dealer order
  const isDealerOrder = orderId.includes("DO-")
  const endpoint = isDealerOrder ? `/api/dealer/orders/${orderId}` : `/api/orders/${orderId}`

  fetch(endpoint)
    .then((response) => response.json())
    .then((order) => {
      // Format the order details differently based on type
      let receiptDetails

      if (isDealerOrder) {
        receiptDetails = `
          <strong>Order ID:</strong> ${order.order_id}<br>
          <strong>Customer:</strong> ${order.customer} (Dealer)<br>
          <strong>Product:</strong> ${order.product}<br>
          <strong>Quantity:</strong> ${order.quantity} ${order.unit}<br>
          <strong>Total:</strong> $${Number.parseFloat(order.total).toFixed(2)}<br>
          <strong>Order Date:</strong> ${formatDate(order.order_date)}<br>
          <strong>Status:</strong> ${order.status}<br>
          <strong>Delivery Address:</strong> ${order.delivery_address}<br>
          <strong>Requested Delivery:</strong> ${formatDate(order.delivery_date)}<br>
          ${order.special_instructions ? `<strong>Special Instructions:</strong> ${order.special_instructions}<br>` : ""}
        `
      } else {
        receiptDetails = `
          <strong>Order ID:</strong> ${order.order_id}<br>
          <strong>Customer:</strong> ${order.customer}<br>
          <strong>Items:</strong> ${order.items}<br>
          <strong>Total:</strong> $${Number.parseFloat(order.total).toFixed(2)}<br>
          <strong>Order Date:</strong> ${formatDate(order.order_date)}<br>
          <strong>Status:</strong> ${order.status}
        `
      }

      document.getElementById("receiptDetails").innerHTML = receiptDetails
      document.getElementById("receiptModal").style.display = "block"
    })
    .catch((error) => {
      console.error("Error getting order details:", error)
      showToast("Failed to get order details", "error")
    })
}

// Payments
function loadPaymentsData() {
  // Load payment stats
  fetch("/api/payments/stats")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("paymentsTotalRevenue").textContent = `$${data.totalRevenue.toFixed(2)}`
      document.getElementById("pendingPayments").textContent = `$${data.pendingPayments.toFixed(2)}`
      document.getElementById("pendingPaymentsCount").textContent = `${data.pendingCount} orders`
      document.getElementById("todayPayments").textContent = `$${data.todayPayments.toFixed(2)}`
      document.getElementById("todayPaymentsCount").textContent = `${data.todayCount} orders`
    })
    .catch((error) => {
      console.error("Error loading payment stats:", error)
      showToast("Failed to load payment stats", "error")
    })

  // Load payments table
  fetch("/api/payments")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("paymentsTableBody")
      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>'
        return
      }

      data.forEach((payment) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${payment.payment_id}</td>
                  <td>${payment.order_id}</td>
                  <td>${payment.customer}</td>
                  <td>$${Number.parseFloat(payment.amount).toFixed(2)}</td>
                  <td>${formatDate(payment.date)}</td>
                  <td><span class="status-badge badge-${payment.status.toLowerCase()}">${payment.status}</span></td>
                  <td>${payment.method}</td>
              `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading payments:", error)
      showToast("Failed to load payments", "error")
    })
}

// Utility Functions
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

function showToast(message, type = "success") {
  // Create toast element if it doesn't exist
  let toast = document.querySelector(".toast")
  if (!toast) {
    toast = document.createElement("div")
    toast.className = "toast"
    document.body.appendChild(toast)

    // Add toast styles if they don't exist
    if (!document.querySelector("#toast-styles")) {
      const style = document.createElement("style")
      style.id = "toast-styles"
      style.textContent = `
        .toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          background-color: #333;
          color: white;
          border-radius: 4px;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s;
          max-width: 300px;
        }
        .toast.show {
          opacity: 1;
        }
        .toast-success {
          background-color: #4CAF50;
        }
        .toast-error {
          background-color: #f44336;
        }
        .toast-warning {
          background-color: #ff9800;
        }
      `
      document.head.appendChild(style)
    }
  }

  toast.textContent = message
  toast.className = `toast show toast-${type}`

  setTimeout(() => {
    toast.className = "toast"
  }, 3000)
}

function generateReceipt(orderId, customer, items, total, orderDate, status) {
  const receiptDetails = `
      <strong>Order ID:</strong> ${orderId}<br>
      <strong>Customer:</strong> ${customer}<br>
      <strong>Items:</strong> ${items}<br>
      <strong>Total:</strong> ${total}<br>
      <strong>Order Date:</strong> ${orderDate}<br>
      <strong>Status:</strong> ${status}
  `
  document.getElementById("receiptDetails").innerHTML = receiptDetails
  document.getElementById("receiptModal").style.display = "block"
}

function closeModal() {
  document.getElementById("receiptModal").style.display = "none"
}

// Close modal when clicking outside of it
window.onclick = (event) => {
  const modal = document.getElementById("receiptModal")
  if (event.target == modal) {
    modal.style.display = "none"
  }
}

// Farmer Orders Management
document.addEventListener("DOMContentLoaded", () => {
  // Load dealer orders for farmer
  loadDealerOrders()

  // Set up tab navigation
  const orderTabs = document.querySelectorAll(".order-tab")
  if (orderTabs) {
    orderTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        const status = this.getAttribute("data-status")

        // Update active tab
        orderTabs.forEach((t) => t.classList.remove("active"))
        this.classList.add("active")

        // Load orders with selected status
        loadDealerOrders(status)
      })
    })
  }

  // Set up search functionality
  const searchInput = document.getElementById("order-search")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim()
      if (searchTerm.length >= 2) {
        // Implement search functionality here
        // For now, we'll just reload all orders
        loadDealerOrders()
      } else if (searchTerm.length === 0) {
        loadDealerOrders()
      }
    })
  }
})

// Load dealer orders for farmer
function loadDealerOrders(status = null) {
  const ordersTable = document.getElementById("dealer-orders-table")
  if (!ordersTable) return

  // Show loading indicator
  ordersTable.innerHTML =
    '<tr><td colspan="7" class="text-center"><div class="loader" style="margin: 20px auto;"></div></td></tr>'

  // Build query string
  let url = "/api/dealer/orders/for-farmer"
  if (status && status !== "all") {
    url += `?status=${encodeURIComponent(status)}`
  }

  fetch(url)
    .then((response) => response.json())
    .then((orders) => {
      if (orders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>'
        return
      }

      // Clear table
      ordersTable.innerHTML = ""

      // Add orders to table
      orders.forEach((order) => {
        const row = document.createElement("tr")
        row.setAttribute('data-order-id', order.id)

        // Format date
        const orderDate = new Date(order.order_date)
        const formattedDate = orderDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })

        // Create action buttons based on status
        let actionButtons = ""
        if (order.status === "Pending") {
          actionButtons = `
            <button class="btn btn-primary" data-approve-id="${order.id}" onclick="approveOrder(${order.id})">Approve</button>
            <button class="btn btn-outline" onclick="rejectOrder(${order.id})">Reject</button>
          `
        } else if (order.status === "Processing") {
          actionButtons = `
            <button class="btn btn-primary" onclick="shipOrder(${order.id})">Ship</button>
            <button class="btn btn-outline" onclick="viewOrderDetails(${order.id})">View</button>
          `
        } else {
          actionButtons = `
            <button class="btn btn-primary" onclick="viewOrderDetails(${order.id})">View</button>
          `
        }

        // Determine status class
        let statusClass = ""
        switch (order.status) {
          case "Pending":
            statusClass = "pending"
            break
          case "Processing":
            statusClass = "processing"
            break
          case "In Transit":
            statusClass = "in-transit"
            break
          case "Delivered":
            statusClass = "delivered"
            break
          default:
            statusClass = ""
        }

        row.innerHTML = `
          <td>${order.order_id}</td>
          <td>${order.customer}</td>
          <td>${order.product} (${order.quantity} ${order.unit})</td>
          <td>$${Number(order.total).toFixed(2)}</td>
          <td>${formattedDate}</td>
          <td class="order-status"><span class="status ${statusClass}">${order.status}</span></td>
          <td>${actionButtons}</td>
        `

        ordersTable.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading dealer orders:", error)
      ordersTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading orders</td></tr>'
    })
}

// Accept an order
window.acceptOrder = (orderId) => {
  if (!confirm("Are you sure you want to accept this order?")) return

  fetch(`/api/dealer/orders/${orderId}/accept`, {
    method: "PUT",
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Order accepted successfully")
      loadDealerOrders()
    })
    .catch((error) => {
      console.error("Error accepting order:", error)
      showToast("Error accepting order", "error")
    })
}

// Reject an order
window.rejectOrder = (orderId) => {
  if (!confirm("Are you sure you want to reject this order?")) return

  // In a real app, you would have a proper endpoint for rejecting orders
  // For now, we'll just update the status to "Rejected"
  fetch(`/api/dealer/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "Rejected" }),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Order rejected")
      loadDealerOrders()
    })
    .catch((error) => {
      console.error("Error rejecting order:", error)
      showToast("Error rejecting order", "error")
    })
}

// Ship an order
window.shipOrder = (orderId) => {
  if (!confirm("Are you sure you want to mark this order as shipped?")) return

  fetch(`/api/dealer/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "In Transit" }),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Order marked as shipped", "success")
      loadOrdersData()
      loadDealerOrders()
    })
    .catch((error) => {
      console.error("Error updating order status:", error)
      showToast("Failed to update order status", "error")
    })
}

// NEW FUNCTION: Approve order with inventory reduction
window.approveOrder = (orderId) => {
  if (!confirm("Are you sure you want to approve this order? This will reduce your inventory.")) {
    return;
  }

  // Show loading indicator
  const actionCell = document.querySelector(`button[data-approve-id="${orderId}"]`).parentElement;
  const originalContent = actionCell.innerHTML;
  actionCell.innerHTML = '<div class="loader" style="margin: 0 auto;"></div>';

  // Send approval request to server
  fetch(`/api/dealer/orders/${orderId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Failed to approve order');
      });
    }
    return response.json();
  })
  .then(data => {
    // Show success message
    showToast(data.message, 'success');
    
    // Update the UI to show the order as approved
    const statusCell = document.querySelector(`tr[data-order-id="${orderId}"] td.order-status`);
    if (statusCell) {
      statusCell.innerHTML = '<span class="status-badge badge-processing">Processing</span>';
    }
    
    // Update the action buttons
    actionCell.innerHTML = `
      <button class="btn btn-primary" onclick="viewOrderDetails(${orderId})">View</button>
      <button class="btn btn-outline" onclick="shipOrder(${orderId})">Ship</button>
    `;
    
    // Refresh the inventory data to show updated quantities
    loadInventoryData();
    
    // Refresh the orders list
    loadOrdersData();
    loadDealerOrders();
  })
  .catch(error => {
    console.error('Error approving order:', error);
    showToast('Error: ' + error.message, 'error');
    
    // Restore original action buttons
    actionCell.innerHTML = originalContent;
  });
}