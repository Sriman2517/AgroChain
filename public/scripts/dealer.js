// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  const sidebarItems = document.querySelectorAll(".sidebar-menu li")
  const sections = document.querySelectorAll('[id$="-section"]')
  const tabs = document.querySelectorAll(".tab")
  const tabContents = document.querySelectorAll(".tab-content")
  const notificationIcon = document.getElementById("notificationIcon")
  const notificationDropdown = document.getElementById("notificationDropdown")
  const userProfile = document.getElementById("userProfile")
  const userDropdown = document.getElementById("userDropdown")
  const markAllAsReadBtn = document.getElementById("markAllAsRead")
  const searchInput = document.getElementById("searchInput")
  const searchResults = document.getElementById("searchResults")
  const wishlistContainer = document.getElementById("wishlist-products")
  const emptyWishlist = document.getElementById("empty-wishlist")
  const allProductsContainer = document.getElementById("all-products")
  const ordersTableBody = document.getElementById("orders-table-body")
  const inventoryTableBody = document.getElementById("inventory-table-body")

  // Initialize the page
  loadDashboardStats()
  loadRecentOrders()
  loadProducts()
  loadOrders()
  loadInventory()
  loadVehicles()
  loadAnalytics()
  loadWishlist() // Load wishlist separately
  loadRetailerOrders() // Load retailer orders

  // Show section function
  window.showSection = (sectionId) => {
    // Hide all sections
    sections.forEach((section) => {
      section.classList.remove("active-section")
    })

    // Show the selected section
    document.getElementById(sectionId).classList.add("active-section")

    // Update sidebar active item
    sidebarItems.forEach((item) => {
      item.classList.remove("active")
      if (item.getAttribute("data-section") === sectionId) {
        item.classList.add("active")
      }
    })

    // If showing orders section, check if we need to load retailer orders
    if (sectionId === "orders-section") {
      // Add a tab for retailer orders if it doesn't exist
      const tabsContainer = document.querySelector("#orders-section .tabs")
      if (tabsContainer && !document.querySelector('[data-tab="retailer-orders"]')) {
        const retailerOrdersTab = document.createElement("div")
        retailerOrdersTab.className = "tab"
        retailerOrdersTab.setAttribute("data-tab", "retailer-orders")
        retailerOrdersTab.textContent = "Retailer Orders"
        tabsContainer.appendChild(retailerOrdersTab)
        
        // Add event listener to the new tab
        retailerOrdersTab.addEventListener("click", function() {
          const tabId = this.getAttribute("data-tab")
          
          // Update active tab
          const parentTabs = this.parentElement.querySelectorAll(".tab")
          parentTabs.forEach((t) => t.classList.remove("active"))
          this.classList.add("active")
          
          // Show corresponding content
          const tabContents = document.querySelectorAll(".tab-content")
          tabContents.forEach((content) => {
            content.classList.remove("active")
            if (content.id === tabId) {
              content.classList.add("active")
            }
          })
          
          // Load retailer orders
          loadRetailerOrders()
        })
        
        // Create tab content if it doesn't exist
        if (!document.getElementById("retailer-orders")) {
          const ordersSection = document.getElementById("orders-section")
          const retailerOrdersContent = document.createElement("div")
          retailerOrdersContent.className = "tab-content"
          retailerOrdersContent.id = "retailer-orders"
          retailerOrdersContent.innerHTML = `
            <div class="card">
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Retailer</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="retailer-orders-table-body">
                    <tr>
                      <td colspan="7" class="text-center">Loading retailer orders...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `
          ordersSection.appendChild(retailerOrdersContent)
        }
      }
    }
  }

  // Sidebar navigation
  sidebarItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section")
      showSection(sectionId)
    })
  })

  // Tab navigation
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Update active tab
      const parentTabs = this.parentElement.querySelectorAll(".tab")
      parentTabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding content
      const tabContents = document.querySelectorAll(".tab-content")
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === tabId) {
          content.classList.add("active")
        }
      })

      // If this is an order tab, filter orders by status
      if (tabId.includes("orders")) {
        const status = tabId.replace("-orders", "")
        if (status === "all") {
          loadOrders()
        } else if (tabId === "retailer-orders") {
          loadRetailerOrders()
        } else {
          loadOrders(status)
        }
      }
    })
  })

  // Notification dropdown toggle
  notificationIcon.addEventListener("click", (e) => {
    e.stopPropagation()
    notificationDropdown.classList.toggle("active")

    // Close user dropdown if open
    userDropdown.classList.remove("active")
  })

  // User dropdown toggle
  userProfile.addEventListener("click", (e) => {
    e.stopPropagation()
    userDropdown.classList.toggle("active")

    // Close notification dropdown if open
    notificationDropdown.classList.remove("active")
  })

  // Close dropdowns when clicking elsewhere
  document.addEventListener("click", () => {
    notificationDropdown.classList.remove("active")
    userDropdown.classList.remove("active")
    searchResults.classList.remove("active")
  })

  // Mark all notifications as read
  markAllAsReadBtn.addEventListener("click", () => {
    const notificationItems = document.querySelectorAll(".notification-item")
    notificationItems.forEach((item) => {
      item.classList.add("read")
    })

    // Hide the badge
    document.querySelector(".badge").style.display = "none"

    // Show confirmation message
    showToast("All notifications marked as read")
  })

  // Search functionality
  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim()

    if (query.length < 2) {
      searchResults.classList.remove("active")
      return
    }

    // Search for products
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          searchResults.innerHTML = ""
          data.forEach((item) => {
            const resultItem = document.createElement("div")
            resultItem.className = "search-result-item"
            resultItem.innerHTML = `
              <div style="display: flex; align-items: center;">
                <div>
                  <div>${item.name}</div>
                  <small>${item.category}</small>
                </div>
              </div>
            `
            resultItem.addEventListener("click", () => {
              showSection("products-section")
              searchResults.classList.remove("active")
              searchInput.value = ""

              // Highlight the product
              setTimeout(() => {
                const productElement = document.querySelector(`[data-product-id="${item.id}"]`)
                if (productElement) {
                  productElement.scrollIntoView({ behavior: "smooth" })
                  productElement.style.boxShadow = "0 0 0 2px var(--primary)"
                  setTimeout(() => {
                    productElement.style.boxShadow = ""
                  }, 2000)
                }
              }, 300)
            })
            searchResults.appendChild(resultItem)
          })
          searchResults.classList.add("active")
        } else {
          searchResults.innerHTML = '<div class="search-result-item">No results found</div>'
          searchResults.classList.add("active")
        }
      })
      .catch((error) => {
        console.error("Error searching:", error)
        searchResults.innerHTML = '<div class="search-result-item">Error searching</div>'
        searchResults.classList.add("active")
      })
  })

  searchInput.addEventListener("click", (e) => {
    e.stopPropagation()
  })

  // Profile form submission
  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const profileData = {
      name: document.getElementById("full-name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
    }

    // Save profile data
    fetch("/api/dealer/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
      .then((response) => response.json())
      .then((data) => {
        showToast("Profile updated successfully")
      })
      .catch((error) => {
        console.error("Error updating profile:", error)
        showToast("Error updating profile", "error")
      })
  })

  // Order date filter
  const orderDateInput = document.getElementById("order-date")
  if (orderDateInput) {
    orderDateInput.addEventListener("change", function () {
      const selectedDate = this.value
      if (selectedDate) {
        loadOrders(null, selectedDate)
      } else {
        loadOrders()
      }
    })
  }

  // Order search filter
  const orderSearchInput = document.getElementById("order-search")
  if (orderSearchInput) {
    orderSearchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim()
      if (searchTerm.length >= 2) {
        loadOrders(null, null, searchTerm)
      } else if (searchTerm.length === 0) {
        loadOrders()
      }
    })
  }

  // Initialize filter buttons
  window.applyFilters = applyFilters
  window.resetFilters = resetFilters
  window.openOrderModal = openOrderModal
  window.closeOrderModal = closeOrderModal
})

// Load dashboard stats
function loadDashboardStats() {
  fetch("/api/dealer/dashboard/stats")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("pendingOrdersCount").textContent = data.pendingOrders
      document.getElementById("activeDeliveriesCount").textContent = data.activeDeliveries
      document.getElementById("availableProductsCount").textContent = data.availableProducts
      document.getElementById("verifiedFarmersCount").textContent = data.verifiedFarmers

      // Transport stats
      document.getElementById("availableVehiclesCount").textContent = data.availableVehicles
      document.getElementById("activeRoutesCount").textContent = data.activeRoutes
      document.getElementById("scheduledPickupsCount").textContent = data.scheduledPickups
      document.getElementById("pendingDeliveriesCount").textContent = data.pendingDeliveries

      // Analytics stats
      document.getElementById("monthlyRevenue").textContent = `$${data.monthlyRevenue.toFixed(2)}`
      document.getElementById("growthRate").textContent = `${data.growthRate}%`
      document.getElementById("monthlyOrders").textContent = data.monthlyOrders
      document.getElementById("newCustomers").textContent = data.newCustomers

      // Inventory stats
      if (document.getElementById("inventoryCount")) {
        document.getElementById("inventoryCount").textContent = data.inventoryCount || 0
      }
      if (document.getElementById("lowStockCount")) {
        document.getElementById("lowStockCount").textContent = data.lowStockCount || 0
      }
      
      // Update notification badge for retailer orders if any
      if (data.pendingRetailerOrders > 0) {
        const badge = document.querySelector(".badge")
        if (badge) {
          badge.textContent = data.pendingRetailerOrders
          badge.style.display = "block"
        }
        
        // Add notification to the list
        const notificationsList = document.getElementById("notificationsList")
        if (notificationsList) {
          const notification = document.createElement("li")
          notification.style.padding = "12px 0"
          notification.style.borderBottom = "1px solid var(--border-color)"
          notification.innerHTML = `
            <div style="display: flex; align-items: flex-start;">
              <i class="fas fa-shopping-cart" style="color: var(--primary); margin-right: 10px; margin-top: 2px;"></i>
              <div>
                <p style="margin-bottom: 5px;">${data.pendingRetailerOrders} new retailer order(s) pending approval</p>
                <small style="color: var(--text-light);">Just now</small>
              </div>
            </div>
          `
          notificationsList.prepend(notification)
        }
      }
    })
    .catch((error) => {
      console.error("Error loading dashboard stats:", error)
      showToast("Error loading dashboard stats", "error")
    })
}

// Load recent orders
function loadRecentOrders() {
  fetch("/api/dealer/orders/recent")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("recentOrdersTableBody")
      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent orders found</td></tr>'
        return
      }

      data.forEach((order) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${order.order_id}</td>
          <td>${order.product}</td>
          <td>${order.quantity} ${order.unit || ""}</td>
          <td><span class="status ${order.status.toLowerCase().replace(" ", "-")}">${order.status}</span></td>
          <td><button class="btn btn-primary btn-sm" onclick="viewOrderDetails('${order.id}')">View</button></td>
        `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading recent orders:", error)
      document.getElementById("recentOrdersTableBody").innerHTML =
        '<tr><td colspan="5" class="text-center">Error loading recent orders</td></tr>'
    })
}

// Load products
function loadProducts() {
  const productsLoader = document.getElementById("products-loader")
  if (productsLoader) productsLoader.style.display = "block"

  fetch("/api/products")
    .then((response) => response.json())
    .then((data) => {
      const productsContainer = document.getElementById("all-products")
      productsContainer.innerHTML = ""

      if (productsLoader) productsLoader.style.display = "none"

      if (data.length === 0) {
        productsContainer.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-seedling"></i>
            <h3>No products available</h3>
            <p>Check back later for new products</p>
          </div>
        `
        return
      }

      data.forEach((product) => {
        const productCard = document.createElement("div")
        productCard.className = "product-card"
        productCard.setAttribute("data-product-id", product.id)
        productCard.setAttribute("data-category", product.category.toLowerCase())
        productCard.setAttribute("data-price", product.price)

        productCard.innerHTML = `
          <div class="product-details">
            <h4 class="product-title">${product.name}</h4>
            <div class="product-meta">
              <span class="product-price">$${Number.parseFloat(product.price).toFixed(2)}/${product.unit}</span>
              <span class="product-quantity">Min: ${product.min_stock} ${product.unit}</span>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary order-now-btn" style="flex: 1; margin-right: 5px;" data-product-id="${product.id}">Order Now</button>
              <button class="btn btn-outline btn-like ${product.liked ? "active" : ""}" style="width: 40px;" onclick="toggleLike(${product.id})">
                <i class="fas fa-heart"></i>
              </button>
            </div>
          </div>
        `

        productsContainer.appendChild(productCard)
      })

      // Add event listeners to all "Order Now" buttons
      document.querySelectorAll(".order-now-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const productId = this.getAttribute("data-product-id")
          openOrderModal(productId)
        })
      })
    })
    .catch((error) => {
      console.error("Error loading products:", error)
      if (productsLoader) productsLoader.style.display = "none"

      document.getElementById("all-products").innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error loading products</h3>
          <p>Please try again later</p>
        </div>
      `
    })
}

// Load inventory
function loadInventory() {
  fetch("/api/dealer/inventory")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("inventory-table-body")
      if (!tableBody) return

      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No inventory items found</td></tr>'
        return
      }

      data.forEach((item) => {
        const row = document.createElement("tr")

        // Determine status class
        let statusClass
        if (item.status === "Out of Stock") {
          statusClass = "pending"
        } else if (item.status === "Low Stock") {
          statusClass = "in-transit"
        } else {
          statusClass = "delivered"
        }

        row.innerHTML = `
          <td>${item.id}</td>
          <td>${item.product_name}</td>
          <td>${item.category}</td>
          <td>$${Number.parseFloat(item.price).toFixed(2)}/${item.unit}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.min_stock} ${item.unit}</td>
          <td><span class="status ${statusClass}">${item.status}</span></td>
          <td>${formatDate(item.last_updated)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editInventoryItem(${item.id})">Edit</button>
            <button class="btn btn-outline btn-sm" onclick="deleteInventoryItem(${item.id})">Delete</button>
          </td>
        `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading inventory:", error)
      const tableBody = document.getElementById("inventory-table-body")
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Error loading inventory</td></tr>'
      }
    })
}

// Load retailer orders
function loadRetailerOrders() {
  fetch("/api/dealer/retailer-orders")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("retailer-orders-table-body")
      if (!tableBody) return

      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No retailer orders found</td></tr>'
        return
      }

      data.forEach((order) => {
        const row = document.createElement("tr")
        
        // Determine status class
        let statusClass = ""
        if (order.status === "Pending") {
          statusClass = "pending"
        } else if (order.status === "Processing") {
          statusClass = "in-transit"
        } else if (order.status === "Delivered") {
          statusClass = "delivered"
        }

        row.innerHTML = `
          <td>${order.order_id}</td>
          <td>Retailer #${order.retailer_id}</td>
          <td>${order.product_name}</td>
          <td>${order.quantity} ${order.unit}</td>
          <td>$${Number(order.total).toFixed(2)}</td>
          <td><span class="status ${statusClass}">${order.status}</span></td>
          <td>
            ${order.status === "Pending" ? 
              `<button class="btn btn-primary btn-sm" onclick="approveRetailerOrder(${order.id})">Approve</button>
               <button class="btn btn-outline btn-sm" onclick="rejectRetailerOrder(${order.id})">Reject</button>` : 
              `<button class="btn btn-primary btn-sm" onclick="viewRetailerOrderDetails(${order.id})">View</button>`
            }
          </td>
        `

        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading retailer orders:", error)
      const tableBody = document.getElementById("retailer-orders-table-body")
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading retailer orders</td></tr>'
      }
    })
}

// Approve retailer order
window.approveRetailerOrder = (orderId) => {
  if (confirm("Are you sure you want to approve this order? This will update your inventory.")) {
    fetch(`/api/dealer/retailer-orders/${orderId}/approve`, {
      method: "PUT"
    })
      .then((response) => response.json())
      .then((data) => {
        showToast("Order approved successfully")
        loadRetailerOrders()
        loadInventory() // Reload inventory to reflect changes
        loadDashboardStats() // Reload stats
      })
      .catch((error) => {
        console.error("Error approving order:", error)
        showToast("Error approving order", "error")
      })
  }
}

// Reject retailer order
window.rejectRetailerOrder = (orderId) => {
  if (confirm("Are you sure you want to reject this order?")) {
    fetch(`/api/retailer/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "Rejected" })
    })
      .then((response) => response.json())
      .then((data) => {
        showToast("Order rejected successfully")
        loadRetailerOrders()
        loadDashboardStats() // Reload stats
      })
      .catch((error) => {
        console.error("Error rejecting order:", error)
        showToast("Error rejecting order", "error")
      })
  }
}

// View retailer order details
window.viewRetailerOrderDetails = (orderId) => {
  fetch(`/api/dealer/retailer-orders/${orderId}`)
    .then((response) => response.json())
    .then((order) => {
      const orderDetailsModal = document.getElementById("orderDetailsModal")
      
      const content = `
        <div style="padding: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Order Information</h4>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Total:</strong> $${Number.parseFloat(order.total).toFixed(2)}</p>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Retailer Information</h4>
              <p><strong>Retailer ID:</strong> ${order.retailer_id}</p>
              <p><strong>Product:</strong> ${order.product_name}</p>
              <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
              <p><strong>Unit Price:</strong> $${Number.parseFloat(order.unit_price).toFixed(2)}/${order.unit}</p>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Delivery Information</h4>
            <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
            <p><strong>Requested Delivery Date:</strong> ${formatDate(order.delivery_date)}</p>
            ${order.special_instructions ? `<p><strong>Special Instructions:</strong> ${order.special_instructions}</p>` : ""}
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Order Timeline</h4>
            <div style="display: flex; justify-content: space-between; position: relative; margin-top: 30px; margin-bottom: 50px;">
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: var(--primary); border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Order Placed</p>
                <small>${formatDate(order.order_date)}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "Pending" ? "#ccc" : "var(--primary)"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Processing</p>
                <small>${order.status !== "Pending" ? formatDate(order.processing_date || order.order_date) : "Pending"}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "In Transit" || order.status === "Delivered" ? "var(--primary)" : "#ccc"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Shipped</p>
                <small>${order.status === "In Transit" || order.status === "Delivered" ? formatDate(order.shipping_date || order.order_date) : "Pending"}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "Delivered" ? "var(--primary)" : "#ccc"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Delivered</p>
                <small>${order.status === "Delivered" ? formatDate(order.delivery_date) : "Pending"}</small>
              </div>
              <div style="position: absolute; top: 10px; left: 0; right: 0; height: 2px; background-color: #ccc; z-index: 0;"></div>
            </div>
          </div>
        </div>
      `
      
      document.getElementById("orderDetailsContent").innerHTML = content
      orderDetailsModal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error getting order details:", error)
      showToast("Error loading order details", "error")
    })
}

// Load wishlist
function loadWishlist() {
  fetch("/api/dealer/wishlist")
    .then((response) => response.json())
    .then((data) => {
      updateWishlist(data)
    })
    .catch((error) => {
      console.error("Error loading wishlist:", error)
      showToast("Error loading wishlist", "error")
    })
}

// Update wishlist
function updateWishlist(likedProducts) {
  const wishlistContainer = document.getElementById("wishlist-products")
  const emptyWishlist = document.getElementById("empty-wishlist")

  if (!wishlistContainer) return

  if (!likedProducts || likedProducts.length === 0) {
    if (emptyWishlist) emptyWishlist.style.display = "block"
    wishlistContainer.innerHTML = ""
    if (emptyWishlist) wishlistContainer.appendChild(emptyWishlist)
  } else {
    if (emptyWishlist) emptyWishlist.style.display = "none"
    wishlistContainer.innerHTML = ""

    likedProducts.forEach((product) => {
      const productCard = document.createElement("div")
      productCard.className = "product-card"
      productCard.setAttribute("data-product-id", product.id)

      productCard.innerHTML = `
        <div class="product-details">
          <h4 class="product-title">${product.name}</h4>
          <div class="product-meta">
            <span class="product-price">$${Number.parseFloat(product.price).toFixed(2)}/${product.unit}</span>
            <span class="product-quantity">Min: ${product.min_stock} ${product.unit}</span>
          </div>
          <div class="product-actions">
            <button class="btn btn-primary" style="flex: 1; margin-right: 5px;" onclick="openOrderModal(${product.id})">Order Now</button>
            <button class="btn btn-outline btn-like active" style="width: 40px;" onclick="toggleLike(${product.id})">
              <i class="fas fa-heart"></i>
            </button>
          </div>
        </div>
      `

      wishlistContainer.appendChild(productCard)
    })
  }
}

// Toggle like status
window.toggleLike = (productId) => {
  fetch(`/api/products/${productId}/like`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      // Update the like button status
      const likeButtons = document.querySelectorAll(`.product-card[data-product-id="${productId}"] .btn-like`)
      likeButtons.forEach((button) => {
        if (data.liked) {
          button.classList.add("active")
        } else {
          button.classList.remove("active")
        }
      })

      // Reload wishlist
      loadWishlist()

      showToast(data.liked ? "Added to wishlist" : "Removed from wishlist")
    })
    .catch((error) => {
      console.error("Error toggling like status:", error)
      showToast("Error updating wishlist", "error")
    })
}

// Open order modal
window.openOrderModal = (productId) => {
  const orderModal = document.getElementById("orderModal")

  fetch(`/api/products/${productId}`)
    .then((response) => response.json())
    .then((product) => {
      document.getElementById("product-name").value = product.name
      document.getElementById("unit-price").value = `$${product.price}/${product.unit}`
      document.getElementById("min-order").textContent = product.min_stock
      document.getElementById("quantity").min = product.min_stock
      document.getElementById("quantity").value = product.min_stock

      // Set default delivery date to 7 days from now
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 7)
      document.getElementById("delivery-date").value = deliveryDate.toISOString().split("T")[0]

      // Store product ID for order submission
      orderModal.setAttribute("data-product-id", productId)

      // Store product unit for order submission
      orderModal.setAttribute("data-product-unit", product.unit)

      // Show modal
      orderModal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error getting product details:", error)
      showToast("Error loading product details", "error")
    })
}

// Close order modal
window.closeOrderModal = () => {
  const orderModal = document.getElementById("orderModal")
  orderModal.classList.remove("active")
}

// Place order
window.placeOrder = () => {
  const orderModal = document.getElementById("orderModal")
  const productId = orderModal.getAttribute("data-product-id")
  const productUnit = orderModal.getAttribute("data-product-unit")
  const quantity = document.getElementById("quantity").value
  const deliveryDate = document.getElementById("delivery-date").value
  const deliveryAddress = document.getElementById("delivery-address").value
  const specialInstructions = document.getElementById("special-instructions").value

  if (!quantity || !deliveryDate || !deliveryAddress) {
    showToast("Please fill in all required fields", "error")
    return
  }

  // Show loading indicator
  const modalFooter = orderModal.querySelector(".modal-footer")
  const originalButtons = modalFooter.innerHTML
  modalFooter.innerHTML = '<div class="loader" style="margin: 0 auto;"></div>'

  const orderData = {
    product_id: productId,
    quantity,
    delivery_date: deliveryDate,
    delivery_address: deliveryAddress,
    special_instructions: specialInstructions,
    unit: productUnit,
  }

  fetch("/api/dealer/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then((response) => response.json())
    .then((data) => {
      // Restore original buttons
      modalFooter.innerHTML = originalButtons

      // Show success message
      showToast("Order placed successfully! Waiting for farmer approval.")
      closeOrderModal()

      // Reload orders
      loadRecentOrders()
      loadOrders()
      loadDashboardStats()

      // Show the orders section
      showSection("orders-section")
    })
    .catch((error) => {
      // Restore original buttons
      modalFooter.innerHTML = originalButtons

      console.error("Error placing order:", error)
      showToast("Error placing order", "error")
    })
}

// Load orders
function loadOrders(status = null, date = null, search = null) {
  let url = "/api/dealer/orders"
  const params = []

  if (status && status !== "all") {
    params.push(`status=${encodeURIComponent(status)}`)
  }

  if (date) {
    params.push(`date=${encodeURIComponent(date)}`)
  }

  if (search) {
    params.push(`search=${encodeURIComponent(search)}`)
  }

  if (params.length > 0) {
    url += `?${params.join("&")}`
  }

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("orders-table-body")
      if (!tableBody) return

      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>'
        return
      }

      data.forEach((order) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${order.order_id}</td>
          <td>${order.product}</td>
          <td>$${Number.parseFloat(order.total).toFixed(2)}</td>
          <td>${formatDate(order.order_date)}</td>
          <td><span class="status ${order.status.toLowerCase().replace(" ", "-")}">${order.status}</span></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="viewOrderDetails('${order.id}')">View</button>
            ${order.status === "Delivered" ? `<button class="btn btn-outline btn-sm" onclick="trackDelivery('${order.id}')">Track</button>` : ""}
          </td>
        `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading orders:", error)
      const tableBody = document.getElementById("orders-table-body")
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading orders</td></tr>'
      }
    })
}

// View order details
window.viewOrderDetails = (orderId) => {
  const orderDetailsModal = document.getElementById("orderDetailsModal")

  fetch(`/api/dealer/orders/${orderId}`)
    .then((response) => response.json())
    .then((order) => {
      const content = `
        <div style="padding: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Order Information</h4>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Total:</strong> $${Number.parseFloat(order.total).toFixed(2)}</p>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Product Information</h4>
              <p><strong>Product:</strong> ${order.product}</p>
              <p><strong>Quantity:</strong> ${order.quantity} ${order.unit || ""}</p>
              <p><strong>Unit Price:</strong> $${Number.parseFloat(order.unit_price).toFixed(2)}/${order.unit || "unit"}</p>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Delivery Information</h4>
            <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
            <p><strong>Requested Delivery Date:</strong> ${formatDate(order.delivery_date)}</p>
            ${order.special_instructions ? `<p><strong>Special Instructions:</strong> ${order.special_instructions}</p>` : ""}
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Order Timeline</h4>
            <div style="display: flex; justify-content: space-between; position: relative; margin-top: 30px; margin-bottom: 50px;">
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: var(--primary); border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Order Placed</p>
                <small>${formatDate(order.order_date)}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "Pending" ? "#ccc" : "var(--primary)"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Processing</p>
                <small>${order.status !== "Pending" ? formatDate(order.processing_date || order.order_date) : "Pending"}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "In Transit" || order.status === "Delivered" ? "var(--primary)" : "#ccc"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Shipped</p>
                <small>${order.status === "In Transit" || order.status === "Delivered" ? formatDate(order.shipping_date || order.order_date) : "Pending"}</small>
              </div>
              <div style="text-align: center; position: relative; z-index: 1;">
                <div style="width: 20px; height: 20px; background-color: ${order.status === "Delivered" ? "var(--primary)" : "#ccc"}; border-radius: 50%; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">Delivered</p>
                <small>${order.status === "Delivered" ? formatDate(order.delivery_date) : "Pending"}</small>
              </div>
              <div style="position: absolute; top: 10px; left: 0; right: 0; height: 2px; background-color: #ccc; z-index: 0;"></div>
            </div>
          </div>
        </div>
      `

      document.getElementById("orderDetailsContent").innerHTML = content
      orderDetailsModal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error getting order details:", error)
      showToast("Error loading order details", "error")
    })
}

// Close order details modal
window.closeOrderDetailsModal = () => {
  const orderDetailsModal = document.getElementById("orderDetailsModal")
  orderDetailsModal.classList.remove("active")
}

// Print order details
window.printOrderDetails = () => {
  const content = document.getElementById("orderDetailsContent").innerHTML
  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Order Details</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h4 { margin-top: 20px; }
          p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h2>Order Details</h2>
        ${content}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

// Track delivery
window.trackDelivery = (orderId) => {
  showToast("Opening tracking information...")

  // In a real application, this would open a tracking interface
  // For now, we'll just show the order details
  viewOrderDetails(orderId)
}

// Load vehicles
function loadVehicles() {
  fetch("/api/dealer/vehicles")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById("vehicles-table-body")
      if (!tableBody) return

      tableBody.innerHTML = ""

      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No vehicles found</td></tr>'
        return
      }

      data.forEach((vehicle) => {
        const row = document.createElement("tr")

        // Different action buttons based on vehicle status
        let actionButtons = ""
        if (vehicle.status === "Available") {
          actionButtons = `
            <button class="btn btn-primary btn-sm" onclick="assignVehicle('${vehicle.id}')">Assign</button>
            <button class="btn btn-outline btn-sm" onclick="viewVehicleDetails('${vehicle.id}')">Details</button>
          `
        } else if (vehicle.status === "On Route") {
          actionButtons = `
            <button class="btn btn-primary btn-sm" onclick="trackVehicle('${vehicle.id}')">Track</button>
            <button class="btn btn-outline btn-sm" onclick="viewVehicleDetails('${vehicle.id}')">Details</button>
          `
        } else {
          actionButtons = `
            <button class="btn btn-primary btn-sm" onclick="scheduleVehicle('${vehicle.id}')">Schedule</button>
            <button class="btn btn-outline btn-sm" onclick="viewVehicleDetails('${vehicle.id}')">Details</button>
          `
        }

        row.innerHTML = `
          <td>${vehicle.vehicle_id}</td>
          <td>${vehicle.type}</td>
          <td>${vehicle.capacity}</td>
          <td>${vehicle.driver}</td>
          <td><span class="status ${vehicle.status.toLowerCase().replace(" ", "-")}">${vehicle.status}</span></td>
          <td>${formatDate(vehicle.last_maintenance)}</td>
          <td>${actionButtons}</td>
        `
        tableBody.appendChild(row)
      })
    })
    .catch((error) => {
      console.error("Error loading vehicles:", error)
      const tableBody = document.getElementById("vehicles-table-body")
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading vehicles</td></tr>'
      }
    })
}

// View vehicle details
window.viewVehicleDetails = (vehicleId) => {
  const vehicleDetailsModal = document.getElementById("vehicleDetailsModal")

  fetch(`/api/dealer/vehicles/${vehicleId}`)
    .then((response) => response.json())
    .then((vehicle) => {
      const content = `
        <div style="padding: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Vehicle Information</h4>
              <p><strong>Vehicle ID:</strong> ${vehicle.vehicle_id}</p>
              <p><strong>Type:</strong> ${vehicle.type}</p>
              <p><strong>Capacity:</strong> ${vehicle.capacity}</p>
              <p><strong>License Plate:</strong> ${vehicle.license_plate}</p>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <h4 style="margin-bottom: 10px;">Status</h4>
              <p><strong>Current Status:</strong> ${vehicle.status}</p>
              <p><strong>Driver:</strong> ${vehicle.driver}</p>
              <p><strong>Fuel Level:</strong> ${vehicle.fuel_level}</p>
              <p><strong>Mileage:</strong> ${vehicle.mileage}</p>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Maintenance</h4>
            <p><strong>Last Maintenance:</strong> ${formatDate(vehicle.last_maintenance)}</p>
            <p><strong>Next Scheduled Maintenance:</strong> ${formatDate(vehicle.next_maintenance)}</p>
          </div>
        </div>
      `

      document.getElementById("vehicleDetailsContent").innerHTML = content
      vehicleDetailsModal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error getting vehicle details:", error)
      showToast("Error loading vehicle details", "error")
    })
}

// Close vehicle details modal
window.closeVehicleDetailsModal = () => {
  const vehicleDetailsModal = document.getElementById("vehicleDetailsModal")
  vehicleDetailsModal.classList.remove("active")
}

// Load analytics
function loadAnalytics() {
  // This would be implemented with real data in a production environment
  // For now, we'll just use placeholder data
  const monthlyRevenue = document.getElementById("monthlyRevenue")
  const growthRate = document.getElementById("growthRate")
  const monthlyOrders = document.getElementById("monthlyOrders")
  const newCustomers = document.getElementById("newCustomers")

  if (monthlyRevenue) monthlyRevenue.textContent = "$24,580"
  if (growthRate) growthRate.textContent = "18%"
  if (monthlyOrders) monthlyOrders.textContent = "85"
  if (newCustomers) newCustomers.textContent = "12"
}

// Inventory Functions
window.openAddInventoryModal = () => {
  const inventoryModal = document.getElementById("inventoryModal")
  document.getElementById("inventoryModalTitle").textContent = "Add Inventory Item"
  document.getElementById("inventoryForm").reset()
  document.getElementById("inventory-id").value = ""
  inventoryModal.classList.add("active")
}

window.closeInventoryModal = () => {
  const inventoryModal = document.getElementById("inventoryModal")
  inventoryModal.classList.remove("active")
}

window.saveInventoryItem = () => {
  const inventoryId = document.getElementById("inventory-id").value
  const productName = document.getElementById("product-name-input").value
  const category = document.getElementById("category-input").value
  const price = document.getElementById("price-input").value
  const unit = document.getElementById("unit-input").value
  const quantity = document.getElementById("quantity-input").value
  const minStock = document.getElementById("min-stock-input").value
  const description = document.getElementById("description-input").value

  if (!productName || !price || !quantity || !minStock) {
    showToast("Please fill in all required fields", "error")
    return
  }

  const inventoryData = {
    product_name: productName,
    category,
    price,
    unit,
    quantity,
    min_stock: minStock,
    description,
  }

  const url = inventoryId ? `/api/dealer/inventory/${inventoryId}` : "/api/dealer/inventory"

  const method = inventoryId ? "PUT" : "POST"

  fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inventoryData),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast(inventoryId ? "Inventory item updated successfully" : "Inventory item added successfully")
      closeInventoryModal()
      loadInventory()
      loadDashboardStats()
    })
    .catch((error) => {
      console.error("Error saving inventory item:", error)
      showToast("Error saving inventory item", "error")
    })
}

window.editInventoryItem = (itemId) => {
  fetch(`/api/dealer/inventory/${itemId}`)
    .then((response) => response.json())
    .then((item) => {
      document.getElementById("inventoryModalTitle").textContent = "Edit Inventory Item"
      document.getElementById("inventory-id").value = item.id
      document.getElementById("product-name-input").value = item.product_name
      document.getElementById("category-input").value = item.category
      document.getElementById("price-input").value = item.price
      document.getElementById("unit-input").value = item.unit
      document.getElementById("quantity-input").value = item.quantity
      document.getElementById("min-stock-input").value = item.min_stock
      document.getElementById("description-input").value = item.description || ""

      const inventoryModal = document.getElementById("inventoryModal")
      inventoryModal.classList.add("active")
    })
    .catch((error) => {
      console.error("Error getting inventory item:", error)
      showToast("Error loading inventory item details", "error")
    })
}

window.deleteInventoryItem = (itemId) => {
  if (confirm("Are you sure you want to delete this inventory item?")) {
    fetch(`/api/dealer/inventory/${itemId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        showToast("Inventory item deleted successfully")
        loadInventory()
        loadDashboardStats()
      })
      .catch((error) => {
        console.error("Error deleting inventory item:", error)
        showToast("Error deleting inventory item", "error")
      })
  }
}

// Filter functions
window.resetFilters = () => {
  document.getElementById("product-type").value = ""
  document.getElementById("location").value = ""
  document.getElementById("price-range").value = ""
  document.getElementById("quality").value = ""

  loadProducts()
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return "N/A"
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
  }

  toast.textContent = message
  toast.className = `toast show toast-${type}`

  setTimeout(() => {
    toast.className = "toast"
  }, 3000)
}

window.applyFilters = () => {
  const type = document.getElementById("product-type").value.toLowerCase()
  const location = document.getElementById("location").value
  const priceRange = document.getElementById("price-range").value
  const quality = document.getElementById("quality").value

  // Show loading indicator
  const productsContainer = document.getElementById("all-products")
  productsContainer.innerHTML = '<div class="loader" style="margin: 50px auto;"></div>'

  // Build query string
  const queryParams = []
  if (type) queryParams.push(`type=${encodeURIComponent(type)}`)
  if (location) queryParams.push(`location=${encodeURIComponent(location)}`)
  if (priceRange) queryParams.push(`price=${encodeURIComponent(priceRange)}`)
  if (quality) queryParams.push(`quality=${encodeURIComponent(quality)}`)

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : ""

  fetch(`/api/products/filter${queryString}`)
    .then((response) => response.json())
    .then((data) => {
      productsContainer.innerHTML = ""

      if (data.length === 0) {
        productsContainer.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-filter"></i>
            <h3>No products match your filters</h3>
            <p>Try adjusting your filter criteria</p>
            <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
          </div>
        `
        return
      }

      data.forEach((product) => {
        const productCard = document.createElement("div")
        productCard.className = "product-card"
        productCard.setAttribute("data-product-id", product.id)
        productCard.setAttribute("data-category", product.category.toLowerCase())
        productCard.setAttribute("data-price", product.price)

        productCard.innerHTML = `
          <div class="product-details">
            <h4 class="product-title">${product.name}</h4>
            <div class="product-meta">
              <span class="product-price">$${Number.parseFloat(product.price).toFixed(2)}/${product.unit}</span>
              <span class="product-quantity">Min: ${product.min_stock} ${product.unit}</span>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary order-now-btn" style="flex: 1; margin-right: 5px;" data-product-id="${product.id}">Order Now</button>
              <button class="btn btn-outline btn-like ${product.liked ? "active" : ""}" style="width: 40px;" onclick="toggleLike(${product.id})">
                <i class="fas fa-heart"></i>
              </button>
            </div>
          </div>
        `

        productsContainer.appendChild(productCard)
      })

      // Add event listeners to all "Order Now" buttons
      document.querySelectorAll(".order-now-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const productId = this.getAttribute("data-product-id")
          openOrderModal(productId)
        })
      })
    })
    .catch((error) => {
      console.error("Error filtering products:", error)
      showToast("Error filtering products", "error")

      productsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error filtering products</h3>
          <p>Please try again later</p>
          <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
        </div>
      `
    })
}

// Vehicle management functions
window.assignVehicle = (vehicleId) => {
  // Get active orders that need transport
  fetch("/api/dealer/orders?status=Processing")
    .then((response) => response.json())
    .then((orders) => {
      if (orders.length === 0) {
        showToast("No orders available for assignment", "error")
        return
      }

      // In a real app, this would open a modal to select an order
      // For demo purposes, we'll just assign the first order
      const orderId = orders[0].id

      fetch(`/api/dealer/vehicles/${vehicleId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      })
        .then((response) => response.json())
        .then((data) => {
          showToast("Vehicle assigned successfully")
          loadVehicles()
          loadOrders()
        })
        .catch((error) => {
          console.error("Error assigning vehicle:", error)
          showToast("Error assigning vehicle", "error")
        })
    })
    .catch((error) => {
      console.error("Error loading orders for assignment:", error)
      showToast("Error loading orders", "error")
    })
}

window.trackVehicle = (vehicleId) => {
  // This would open a modal to track the vehicle
  showToast("Opening vehicle tracking interface...")

  // In a real app, this would show a map with the vehicle's location
  // For demo purposes, we'll just show the vehicle details
  viewVehicleDetails(vehicleId)
}

window.scheduleVehicle = (vehicleId) => {
  // This would open a modal to schedule maintenance
  const maintenanceDate = new Date()
  maintenanceDate.setDate(maintenanceDate.getDate() + 14) // Schedule 2 weeks from now

  fetch(`/api/dealer/vehicles/${vehicleId}/maintenance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maintenance_date: maintenanceDate.toISOString().split("T")[0],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Maintenance scheduled successfully")
      loadVehicles()
    })
    .catch((error) => {
      console.error("Error scheduling maintenance:", error)
      showToast("Error scheduling maintenance", "error")
    })
}

window.openAddVehicleModal = () => {
  // This would open a modal to add a new vehicle
  showToast("Vehicle addition functionality would be implemented here")

  // In a real app, this would open a form to add a new vehicle
  // For demo purposes, we'll just add a sample vehicle
  const newVehicle = {
    vehicle_id: `VEH-${Math.floor(1000 + Math.random() * 9000)}`,
    type: "Delivery Van",
    capacity: "1.5 tons",
    driver: "New Driver",
    status: "Available",
    license_plate: `AG-${Math.floor(1000 + Math.random() * 9000)}`,
    fuel_level: "100%",
    mileage: "0 km",
    last_maintenance: new Date().toISOString().split("T")[0],
    next_maintenance: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0],
  }

  fetch("/api/dealer/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newVehicle),
  })
    .then((response) => response.json())
    .then((data) => {
      showToast("Vehicle added successfully")
      loadVehicles()
      loadDashboardStats()
    })
    .catch((error) => {
      console.error("Error adding vehicle:", error)
      showToast("Error adding vehicle", "error")
    })
}

// Edit vehicle
window.editVehicle = () => {
  // This would open a form to edit the vehicle
  showToast("Vehicle updated successfully")
  closeVehicleDetailsModal()
  loadVehicles()
}

// Add a function to show toast messages if it doesn't exist
if (typeof showToast !== "function") {
  window.showToast = (message, type = "success") => {
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
            background-color: var(--success);
          }
          .toast-error {
            background-color: var(--danger);
          }
          .toast-warning {
            background-color: var(--warning);
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
}
