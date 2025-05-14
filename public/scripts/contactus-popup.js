// Get the popup elements
const popup = document.getElementById("demoRequestPopup")
const closeBtn = document.querySelector(".close-popup")
const demoBtn = document.querySelector(".btn-demo")
const contactLinks = document.querySelectorAll('a[href="/contactus"]')
const form = document.getElementById("demoRequestForm")

// Open popup when demo button is clicked
demoBtn.addEventListener("click", () => {
  popup.style.display = "flex"
})

// Open popup when any Contact Us link is clicked
contactLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault() // Prevent navigation to /contactus
    popup.style.display = "flex"
  })
})

// Close popup when X is clicked
closeBtn.addEventListener("click", () => {
  popup.style.display = "none"
})

// Close popup when clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === popup) {
    popup.style.display = "none"
  }
})

// Form submission
form.addEventListener("submit", (event) => {
  event.preventDefault()

  // Get form values
  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const phone = document.getElementById("phone").value
  const message = document.getElementById("message").value

  // Show loading state
  const submitBtn = form.querySelector(".submit-btn")
  const originalBtnText = submitBtn.textContent
  submitBtn.textContent = "Sending..."
  submitBtn.disabled = true

  // Send the form data to the server
  fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, phone, message }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Reset button state
      submitBtn.textContent = originalBtnText
      submitBtn.disabled = false

      if (data.success) {
        // Show success message
        alert("Thank you for your message! We will contact you soon.")

        // Reset form and close popup
        form.reset()
        popup.style.display = "none"
      } else {
        // Show error message
        alert(data.error || "There was an error sending your message. Please try again.")
      }
    })
    .catch((error) => {
      console.error("Error submitting form:", error)

      // Reset button state
      submitBtn.textContent = originalBtnText
      submitBtn.disabled = false

      // Show error message
      alert("There was an error sending your message. Please try again.")
    })
})
