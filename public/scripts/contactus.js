document.addEventListener('DOMContentLoaded', function() {
    const demoRequestForm = document.getElementById('demoRequestForm');
    const popup = document.getElementById('demoRequestPopup');
    const closePopup = document.querySelector('.close-popup');
    const requestDemoBtn = document.getElementById('requestDemoBtn');
    
    // Show popup when request demo button is clicked
    if (requestDemoBtn) {
      requestDemoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        popup.style.display = 'flex';
      });
    }
    
    // Close popup when close button is clicked
    if (closePopup) {
      closePopup.addEventListener('click', function() {
        popup.style.display = 'none';
      });
    }
    
    // Close popup when clicking outside the content
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        popup.style.display = 'none';
      }
    });
    
    // Handle form submission
    demoRequestForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
      };
      
      try {
        const response = await fetch('/api/contact-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Show success message
          alert('Thank you for your submission! We will contact you shortly.');
          
          // Clear form
          demoRequestForm.reset();
          
          // Close popup
          popup.style.display = 'none';
        } else {
          alert(result.error || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Please try again later.');
      }
    });
  });