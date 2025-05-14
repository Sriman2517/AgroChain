// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    // Navigation
    const sidebarItems = document.querySelectorAll(".sidebar-menu li")
    const sections = document.querySelectorAll(".page-section")
    const notificationIcon = document.getElementById("notification-icon")
    const notificationPanel = document.getElementById("notification-panel")
    const userProfile = document.querySelector(".dropdown")
    const userDropdown = document.getElementById("user-dropdown")
    const searchInput = document.getElementById("search-input")
    const searchResults = document.getElementById("searchResults")
    const applyFiltersBtn = document.getElementById("apply-filters")
    const resetFiltersBtn = document.getElementById("reset-filters")
    const distApplyFilters = document.getElementById("dist-apply-filters")
    const distResetFilters = document.getElementById("dist-reset-filters")
    const ordersApplyFilters = document.getElementById("orders-apply-filters")
    const ordersResetFilters = document.getElementById("orders-reset-filters")
    const addInventoryBtn = document.getElementById("add-inventory-btn")
    const toast = document.getElementById("toast")
  
    // Initialize the page
    loadDashboardStats()
    loadDealerInventory()
  
    // Navigation function
    function showSection(sectionId) {
      // Hide all sections
      sections.forEach((section) => {
        section.classList.remove("active")
      })
  
      // Show the selected section
      document.getElementById(sectionId).classList.add("active")
  
      // Update sidebar active item
      sidebarItems.forEach((item) => {
        item.classList.remove("active")
        if (item.getAttribute("data-page") === sectionId.replace("-page", "")) {
          item.classList.add("active")
        }
      })
  
      // Load section-specific data
      if (sectionId === "distributors-page") {
        loadAllDealerInventory()
      } else if (sectionId === "purchase-orders-page") {
        loadOrders()
      } else if (sectionId === "inventory-page") {
        loadInventory()
      }
    }
  
    // Make showSection available globally
    window.showSection = showSection
  
    // Sidebar navigation
    sidebarItems.forEach((item) => {
      item.addEventListener("click", function () {
        const sectionId = this.getAttribute("data-page") + "-page"
        showSection(sectionId)
      })
    })
  
    // Stat cards navigation
    document.querySelectorAll(".stat-card").forEach((card) => {
      card.addEventListener("click", function () {
        const targetSection = this.getAttribute("data-target")
        if (targetSection) {
          showSection(targetSection + "-page")
        }
      })
    })
  
    // Notification dropdown toggle
    notificationIcon.addEventListener("click", (e) => {
      e.stopPropagation()
      notificationPanel.classList.toggle("active")
    })
  
    // User dropdown toggle
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("active")
    })
  
    // Close dropdowns when clicking elsewhere
    document.addEventListener("click", () => {
      notificationPanel.classList.remove("active")
      userDropdown.classList.remove("active")
      searchResults.classList.remove("active")
    })
  
    // Search functionality
    searchInput.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim()
  
      if (query.length < 2) {
        searchResults.classList.remove("active")
        return
      }
  
      // Search for dealer inventory products
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
                showSection("distributors-page")
                searchResults.classList.remove("active")
                searchInput.value = ""
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
  
    // Filter functionality for dashboard
    applyFiltersBtn.addEventListener("click", () => {
      const cropFilter = document.getElementById("crop-filter").value.toLowerCase()
      const locationFilter = document.getElementById("location-filter").value.toLowerCase()
      const capacityFilter = document.getElementById("capacity-filter").value
  
      filterDealerInventory(cropFilter, locationFilter, capacityFilter)
      showToast("Filters applied successfully")
    })
  
    resetFiltersBtn.addEventListener("click", () => {
      document.getElementById("crop-filter").value = ""
      document.getElementById("location-filter").value = ""
      document.getElementById("capacity-filter").value = ""
  
      loadDealerInventory()
      showToast("Filters have been reset")
    })
  
    // Filter functionality for distributors page
    distApplyFilters.addEventListener("click", () => {
      const cropFilter = document.getElementById("dist-crop-filter").value.toLowerCase()
      const locationFilter = document.getElementById("dist-location-filter").value.toLowerCase()
      const priceFilter = document.getElementById("dist-price-filter").value
  
      filterAllDealerInventory(cropFilter, locationFilter, priceFilter)
      showToast("Filters applied successfully")
    })
  
    distResetFilters.addEventListener("click", () => {
      document.getElementById("dist-crop-filter").value = ""
      document.getElementById("dist-location-filter").value = ""
      document.getElementById("dist-price-filter").value = ""
  
      loadAllDealerInventory()
      showToast("Filters have been reset")
    })
  
    // Filter functionality for orders page
    ordersApplyFilters &&
      ordersApplyFilters.addEventListener("click", () => {
        const statusFilter = document.getElementById("order-status-filter").value
        const dateFilter = document.getElementById("order-date-filter").value
        const searchFilter = document.getElementById("order-search-filter").value.toLowerCase()
  
        filterOrders(statusFilter, dateFilter, searchFilter)
        showToast("Filters applied successfully")
      })
  
    ordersResetFilters &&
      ordersResetFilters.addEventListener("click", () => {
        document.getElementById("order-status-filter").value = ""
        document.getElementById("order-date-filter").value = ""
        document.getElementById("order-search-filter").value = ""
  
        loadOrders()
        showToast("Filters have been reset")
      })
  
    // View all distributors link
    document.getElementById("view-all-distributors").addEventListener("click", (e) => {
      e.preventDefault()
      showSection("distributors-page")
    })
  
    // Add inventory button
    addInventoryBtn &&
      addInventoryBtn.addEventListener("click", () => {
        openAddInventoryModal()
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
  
      // In a real app, this would save to the server
      showToast("Profile updated successfully", "success")
    })
  
    // Notification preferences form submission
    document.getElementById("notification-form").addEventListener("submit", (e) => {
      e.preventDefault()
  
      const notificationPrefs = {
        emailNotifications: document.getElementById("email-notifications").checked,
        smsNotifications: document.getElementById("sms-notifications").checked,
        priceAlerts: document.getElementById("price-alerts").checked,
        newDistributorAlerts: document.getElementById("new-distributor-alerts").checked,
      }
  
      // In a real app, this would save to the server
      showToast("Notification preferences updated successfully", "success")
    })
  })
  
  // Load dashboard stats
  function loadDashboardStats() {
    fetch("/api/retailer/dashboard/stats")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("active-orders-count").textContent = data.activeOrders
        document.getElementById("products-count").textContent = data.productsCount
        document.getElementById("distributors-count").textContent = data.dealersCount
        document.getElementById("pending-orders-count").textContent = data.pendingOrders
  
        // Update inventory stats if on inventory page
        const totalInventoryCount = document.getElementById("total-inventory-count")
        const lowStockCount = document.getElementById("low-stock-count")
  
        if (totalInventoryCount) {
          totalInventoryCount.textContent = data.productsCount
        }
  
        if (lowStockCount) {
          lowStockCount.textContent = data.lowStockCount
        }
      })
      .catch((error) => {
        console.error("Error loading dashboard stats:", error)
        showToast("Error loading dashboard stats", "error")
      })
  }
  
  // Load dealer inventory for dashboard
  function loadDealerInventory() {
    const tableBody = document.getElementById("dealer-inventory-tbody")
  
    // Show loading spinner
    tableBody.innerHTML = `
          <tr>
              <td colspan="6" class="loading-spinner">
                  <div class="spinner"></div>
              </td>
          </tr>
      `
  
    // Fetch dealer inventory from API
    fetch("/api/retailer/dealer-inventory")
      .then((response) => response.json())
      .then((data) => {
        tableBody.innerHTML = ""
  
        if (data.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No dealer inventory found</td></tr>'
          return
        }
  
        // Display only first 5 items on dashboard
        const displayItems = data.slice(0, 5)
  
        displayItems.forEach((item) => {
          const row = document.createElement("tr")
          row.setAttribute("data-category", item.category.toLowerCase())
          row.setAttribute("data-dealer", item.dealer_id)
          row.setAttribute("data-price", item.price)
  
          // Determine status class
          let statusClass = ""
          if (item.status === "Out of Stock") {
            statusClass = "pending"
          } else if (item.status === "Low Stock") {
            statusClass = "in-transit"
          } else {
            statusClass = "delivered"
          }
  
          row.innerHTML = `
                      <td>Dealer #${item.dealer_id}</td>
                      <td>${item.product_name}</td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>$${Number(item.price).toFixed(2)}/${item.unit}</td>
                      <td><span class="status ${statusClass}">${item.status}</span></td>
                      <td><button class="view-btn" onclick="openOrderModal(${item.id}, '${item.product_name}', ${item.price}, '${item.unit}', ${item.quantity})" ${item.status === "Out of Stock" ? "disabled" : ""}>Order</button></td>
                  `
  
          tableBody.appendChild(row)
        })
      })
      .catch((error) => {
        console.error("Error loading dealer inventory:", error)
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading dealer inventory</td></tr>'
      })
  }
  
  // Load all dealer inventory for distributors page
  function loadAllDealerInventory() {
    const tableBody = document.getElementById("all-dealer-inventory-tbody")
  
    // Show loading spinner
    tableBody.innerHTML = `
          <tr>
              <td colspan="7" class="loading-spinner">
                  <div class="spinner"></div>
              </td>
          </tr>
      `
  
    // Fetch dealer inventory from API
    fetch("/api/retailer/dealer-inventory")
      .then((response) => response.json())
      .then((data) => {
        tableBody.innerHTML = ""
  
        if (data.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No dealer inventory found</td></tr>'
          return
        }
  
        data.forEach((item) => {
          const row = document.createElement("tr")
          row.setAttribute("data-category", item.category.toLowerCase())
          row.setAttribute("data-dealer", item.dealer_id)
          row.setAttribute("data-price", item.price)
  
          // Determine status class
          let statusClass = ""
          if (item.status === "Out of Stock") {
            statusClass = "pending"
          } else if (item.status === "Low Stock") {
            statusClass = "in-transit"
          } else {
            statusClass = "delivered"
          }
  
          row.innerHTML = `
                      <td>Dealer #${item.dealer_id}</td>
                      <td>${item.product_name}</td>
                      <td>${item.category}</td>
                      <td>$${Number(item.price).toFixed(2)}/${item.unit}</td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td><span class="status ${statusClass}">${item.status}</span></td>
                      <td>
                          <button class="view-btn" onclick="openOrderModal(${item.id}, '${item.product_name}', ${item.price}, '${item.unit}', ${item.quantity})" ${item.status === "Out of Stock" ? "disabled" : ""}>Order</button>
                      </td>
                  `
  
          tableBody.appendChild(row)
        })
      })
      .catch((error) => {
        console.error("Error loading dealer inventory:", error)
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading dealer inventory</td></tr>'
      })
  }
  
  // Load orders for purchase orders page
  function loadOrders() {
    const tableBody = document.getElementById("orders-table-body")
  
    // Show loading spinner
    tableBody.innerHTML = `
          <tr>
              <td colspan="7" class="loading-spinner">
                  <div class="spinner"></div>
              </td>
          </tr>
      `
  
    // Fetch retailer orders from API
    fetch("/api/retailer/orders")
      .then((response) => response.json())
      .then((data) => {
        tableBody.innerHTML = ""
  
        if (data.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>'
          return
        }
  
        data.forEach((order) => {
          const row = document.createElement("tr")
          row.setAttribute("data-status", order.status.toLowerCase())
          row.setAttribute("data-date", order.order_date)
          row.setAttribute("data-search", `${order.order_id} ${order.product_name}`.toLowerCase())
  
          // Determine status class
          let statusClass = ""
          if (order.status === "Pending") {
            statusClass = "pending"
          } else if (order.status === "In Transit") {
            statusClass = "in-transit"
          } else if (order.status === "Delivered") {
            statusClass = "delivered"
          } else {
            statusClass = "in-transit" // Processing
          }
  
          row.innerHTML = `
                      <td>${order.order_id}</td>
                      <td>${order.product_name}</td>
                      <td>${order.quantity} ${order.unit}</td>
                      <td>$${Number(order.total).toFixed(2)}</td>
                      <td>${formatDate(order.order_date)}</td>
                      <td><span class="status ${statusClass}">${order.status}</span></td>
                      <td><button class="view-btn" onclick="viewOrderDetails(${order.id})">View</button></td>
                  `
  
          tableBody.appendChild(row)
        })
      })
      .catch((error) => {
        console.error("Error loading orders:", error)
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading orders</td></tr>'
      })
  }
  
  // Load inventory for inventory page
  function loadInventory() {
    const tableBody = document.getElementById("inventory-table-body")
  
    // Show loading spinner
    tableBody.innerHTML = `
          <tr>
              <td colspan="8" class="loading-spinner">
                  <div class="spinner"></div>
              </td>
          </tr>
      `
  
    // Fetch retailer inventory from API
    fetch("/api/retailer/inventory")
      .then((response) => response.json())
      .then((data) => {
        tableBody.innerHTML = ""
  
        if (data.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No inventory items found</td></tr>'
          return
        }
  
        data.forEach((item) => {
          const row = document.createElement("tr")
  
          // Determine status class
          let statusClass = ""
          if (item.status === "Out of Stock") {
            statusClass = "pending"
          } else if (item.status === "Low Stock") {
            statusClass = "in-transit"
          } else {
            statusClass = "delivered"
          }
  
          row.innerHTML = `
                      <td>${item.product_name}</td>
                      <td>${item.category}</td>
                      <td>$${Number(item.price).toFixed(2)}/${item.unit}</td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>${item.min_stock} ${item.unit}</td>
                      <td><span class="status ${statusClass}">${item.status}</span></td>
                      <td>${formatDate(item.last_updated)}</td>
                      <td>
                          <button class="view-btn" onclick="editInventoryItem(${item.id})">Edit</button>
                      </td>
                  `
  
          tableBody.appendChild(row)
        })
      })
      .catch((error) => {
        console.error("Error loading inventory:", error)
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading inventory</td></tr>'
      })
  }
  
  // Filter dealer inventory
  function filterDealerInventory(category, location, capacity) {
    const tableRows = document.querySelectorAll("#dealer-inventory-tbody tr")
  
    tableRows.forEach((row) => {
      if (!row.hasAttribute("data-category")) return
  
      const rowCategory = row.getAttribute("data-category")
      const rowDealer = row.getAttribute("data-dealer")
      const quantityCell = row.querySelector("td:nth-child(3)")
      const quantity = quantityCell ? Number.parseInt(quantityCell.textContent) : 0
  
      let showRow = true
  
      if (category && !rowCategory.includes(category)) {
        showRow = false
      }
  
      if (location && rowDealer !== location) {
        showRow = false
      }
  
      if (capacity) {
        if (capacity === "small" && quantity >= 500) {
          showRow = false
        } else if (capacity === "medium" && (quantity < 500 || quantity > 2000)) {
          showRow = false
        } else if (capacity === "large" && quantity <= 2000) {
          showRow = false
        }
      }
  
      row.style.display = showRow ? "" : "none"
    })
  }
  
  // Filter all dealer inventory
  function filterAllDealerInventory(category, location, priceRange) {
    const tableRows = document.querySelectorAll("#all-dealer-inventory-tbody tr")
  
    tableRows.forEach((row) => {
      if (!row.hasAttribute("data-category")) return
  
      const rowCategory = row.getAttribute("data-category")
      const rowDealer = row.getAttribute("data-dealer")
      const rowPrice = Number.parseFloat(row.getAttribute("data-price"))
  
      let showRow = true
  
      if (category && !rowCategory.includes(category)) {
        showRow = false
      }
  
      if (location && rowDealer !== location) {
        showRow = false
      }
  
      if (priceRange) {
        if (priceRange === "low" && rowPrice >= 5) {
          showRow = false
        } else if (priceRange === "medium" && (rowPrice < 5 || rowPrice > 10)) {
          showRow = false
        } else if (priceRange === "high" && rowPrice <= 10) {
          showRow = false
        }
      }
  
      row.style.display = showRow ? "" : "none"
    })
  }
  
  // Filter orders
  function filterOrders(status, date, search) {
    const tableRows = document.querySelectorAll("#orders-table-body tr")
  
    tableRows.forEach((row) => {
      if (!row.hasAttribute("data-status")) return
  
      const rowStatus = row.getAttribute("data-status")
      const rowDate = row.getAttribute("data-date")
      const rowSearch = row.getAttribute("data-search")
  
      let showRow = true
  
      if (status && rowStatus !== status.toLowerCase()) {
        showRow = false
      }
  
      if (date && rowDate !== date) {
        showRow = false
      }
  
      if (search && !rowSearch.includes(search)) {
        showRow = false
      }
  
      row.style.display = showRow ? "" : "none"
    })
  }
  
  // Open order modal
  window.openOrderModal = (id, productName, price, unit, availableQuantity) => {
    const orderModal = document.getElementById("orderModal")
  
    document.getElementById("product-name").value = productName
    document.getElementById("unit-price").value = `$${price.toFixed(2)}/${unit}`
    document.getElementById("available-quantity").textContent = `${availableQuantity} ${unit}`
    document.getElementById("quantity").max = availableQuantity
  
    // Set default delivery date to 7 days from now
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 7)
    document.getElementById("delivery-date").value = deliveryDate.toISOString().split("T")[0]
  
    // Store product ID for order submission
    orderModal.setAttribute("data-product-id", id)
  
    // Show modal
    orderModal.classList.add("active")
  }
  
  // Close order modal
  window.closeOrderModal = () => {
    const orderModal = document.getElementById("orderModal")
    orderModal.classList.remove("active")
  }
  
  // Place order
  window.placeOrder = () => {
    const orderModal = document.getElementById("orderModal")
    const dealerInventoryId = orderModal.getAttribute("data-product-id")
    const quantity = document.getElementById("quantity").value
    const deliveryDate = document.getElementById("delivery-date").value
    const deliveryAddress = document.getElementById("delivery-address").value
    const specialInstructions = document.getElementById("special-instructions").value
  
    if (!quantity || !deliveryDate || !deliveryAddress) {
      showToast("Please fill in all required fields", "error")
      return
    }
  
    // Show loading indicator
    const confirmBtn = document.querySelector("#orderModal .btn-primary")
    const originalText = confirmBtn.textContent
    confirmBtn.innerHTML = '<span class="loading"></span> Processing...'
    confirmBtn.disabled = true
  
    // Send order to API
    fetch("/api/retailer/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dealer_inventory_id: dealerInventoryId,
        quantity: Number.parseInt(quantity),
        delivery_date: deliveryDate,
        delivery_address: deliveryAddress,
        special_instructions: specialInstructions,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to place order")
        }
        return response.json()
      })
      .then((data) => {
        // Reset button
        confirmBtn.innerHTML = originalText
        confirmBtn.disabled = false
  
        // Close modal
        closeOrderModal()
  
        // Show success message
        showToast("Order placed successfully! Waiting for dealer approval.", "success")
  
        // Reload data
        loadDashboardStats()
        loadDealerInventory()
        loadAllDealerInventory()
        if (document.getElementById("orders-table-body")) {
          loadOrders()
        }
      })
      .catch((error) => {
        // Reset button
        confirmBtn.innerHTML = originalText
        confirmBtn.disabled = false
  
        console.error("Error placing order:", error)
        showToast("Error placing order: " + error.message, "error")
      })
  }
  
  // View order details
  window.viewOrderDetails = (orderId) => {
    fetch(`/api/retailer/orders/${orderId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch order details")
        }
        return response.json()
      })
      .then((order) => {
        // Create a modal to display order details
        const modal = document.createElement("div")
        modal.className = "modal-overlay active"
  
        modal.innerHTML = `
                  <div class="modal">
                      <div class="modal-header">
                          <h2 class="modal-title">Order Details</h2>
                          <button class="close-btn" onclick="closeOrderDetailsModal(this)">&times;</button>
                      </div>
                      <div class="modal-body">
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
                                      <p><strong>Product:</strong> ${order.product_name}</p>
                                      <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
                                      <p><strong>Unit Price:</strong> $${Number.parseFloat(order.unit_price).toFixed(2)}/${order.unit}</p>
                                      <p><strong>Dealer:</strong> Dealer #${order.dealer_id}</p>
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
                      </div>
                      <div class="modal-footer">
                          <button class="btn btn-outline" onclick="closeOrderDetailsModal(this)">Close</button>
                          <button class="btn btn-primary" onclick="printOrderDetails()">Print</button>
                      </div>
                  </div>
              `
  
        document.body.appendChild(modal)
      })
      .catch((error) => {
        console.error("Error fetching order details:", error)
        showToast("Error fetching order details: " + error.message, "error")
      })
  }
  
  // Close order details modal
  window.closeOrderDetailsModal = (element) => {
    const modal = element.closest(".modal-overlay")
    modal.remove()
  }
  
  // Print order details
  window.printOrderDetails = () => {
    const content = document.querySelector(".modal-body").innerHTML
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
  
  // Open add inventory modal
  window.openAddInventoryModal = () => {
    const modal = document.getElementById("addInventoryModal")
    modal.classList.add("active")
  }
  
  // Close add inventory modal
  window.closeAddInventoryModal = () => {
    const modal = document.getElementById("addInventoryModal")
    modal.classList.remove("active")
  }
  
  // Add inventory item
  window.addInventoryItem = () => {
    const productName = document.getElementById("inv-product-name").value
    const category = document.getElementById("inv-category").value
    const price = document.getElementById("inv-price").value
    const quantity = document.getElementById("inv-quantity").value
    const unit = document.getElementById("inv-unit").value
    const minStock = document.getElementById("inv-min-stock").value
  
    if (!productName || !category || !price || !quantity || !unit || !minStock) {
      showToast("Please fill in all required fields", "error")
      return
    }
  
    // Show loading indicator
    const confirmBtn = document.querySelector("#addInventoryModal .btn-primary")
    const originalText = confirmBtn.textContent
    confirmBtn.innerHTML = '<span class="loading"></span> Processing...'
    confirmBtn.disabled = true
  
    // Send to API
    fetch("/api/retailer/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: productName,
        category: category,
        price: Number.parseFloat(price),
        unit: unit,
        quantity: Number.parseInt(quantity),
        min_stock: Number.parseInt(minStock),
        description: "",
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add inventory item")
        }
        return response.json()
      })
      .then((data) => {
        // Reset button
        confirmBtn.innerHTML = originalText
        confirmBtn.disabled = false
  
        // Close modal
        closeAddInventoryModal()
  
        // Show success message
        showToast("Inventory item added successfully!", "success")
  
        // Reload inventory
        loadInventory()
        loadDashboardStats()
      })
      .catch((error) => {
        // Reset button
        confirmBtn.innerHTML = originalText
        confirmBtn.disabled = false
  
        console.error("Error adding inventory item:", error)
        showToast("Error adding inventory item: " + error.message, "error")
      })
  }
  
  // Edit inventory item
  window.editInventoryItem = (itemId) => {
    fetch(`/api/retailer/inventory/${itemId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch inventory item")
        }
        return response.json()
      })
      .then((item) => {
        const modal = document.getElementById("addInventoryModal")
  
        // Set form values
        document.getElementById("inv-product-name").value = item.product_name
        document.getElementById("inv-category").value = item.category
        document.getElementById("inv-price").value = item.price
        document.getElementById("inv-quantity").value = item.quantity
        document.getElementById("inv-unit").value = item.unit
        document.getElementById("inv-min-stock").value = item.min_stock
  
        // Change button action
        const saveBtn = modal.querySelector(".btn-primary")
        saveBtn.textContent = "Update Item"
        saveBtn.onclick = () => updateInventoryItem(itemId)
  
        // Show modal
        modal.classList.add("active")
      })
      .catch((error) => {
        console.error("Error fetching inventory item:", error)
        showToast("Error fetching inventory item: " + error.message, "error")
      })
  }
  
  // Update inventory item
  window.updateInventoryItem = (itemId) => {
    const productName = document.getElementById("inv-product-name").value
    const category = document.getElementById("inv-category").value
    const price = document.getElementById("inv-price").value
    const quantity = document.getElementById("inv-quantity").value
    const unit = document.getElementById("inv-unit").value
    const minStock = document.getElementById("inv-min-stock").value
  
    if (!productName || !category || !price || !quantity || !unit || !minStock) {
      showToast("Please fill in all required fields", "error")
      return
    }
  
    // Show loading indicator
    const confirmBtn = document.querySelector("#addInventoryModal .btn-primary")
    const originalText = confirmBtn.textContent
    confirmBtn.innerHTML = '<span class="loading"></span> Processing...'
    confirmBtn.disabled = true
  
    // Send to API
    fetch(`/api/retailer/inventory/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: productName,
        category: category,
        price: Number.parseFloat(price),
        unit: unit,
        quantity: Number.parseInt(quantity),
        min_stock: Number.parseInt(minStock),
        description: "",
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update inventory item")
        }
        return response.json()
      })
      .then((data) => {
        // Reset button
        confirmBtn.innerHTML = "Add Item"
        confirmBtn.disabled = false
        confirmBtn.onclick = addInventoryItem
  
        // Close modal
        closeAddInventoryModal()
  
        // Show success message
        showToast("Inventory item updated successfully!", "success")
  
        // Reload inventory
        loadInventory()
        loadDashboardStats()
      })
      .catch((error) => {
        // Reset button
        confirmBtn.innerHTML = originalText
        confirmBtn.disabled = false
  
        console.error("Error updating inventory item:", error)
        showToast("Error updating inventory item: " + error.message, "error")
      })
  }
  
  // Show toast message
  function showToast(message, type = "success") {
    const toast = document.getElementById("toast")
    toast.textContent = message
    toast.className = `toast show toast-${type}`
  
    setTimeout(() => {
      toast.className = "toast"
    }, 3000)
  }
  
  // Mark all notifications as read
  window.markAllAsRead = () => {
    const notificationItems = document.querySelectorAll(".notification-item")
    notificationItems.forEach((item) => {
      item.classList.add("read")
    })
  
    // Hide the badge
    document.querySelector(".notification-badge").style.display = "none"
  
    // Show confirmation message
    showToast("All notifications marked as read")
  }
  
  // Toggle notification panel
  window.toggleNotificationPanel = () => {
    const notificationPanel = document.getElementById("notification-panel")
    notificationPanel.classList.toggle("active")
  }
  
  // Format date
  function formatDate(dateString) {
    if (!dateString) return "N/A"
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  