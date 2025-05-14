 // Mobile menu toggle
 const menuToggle = document.querySelector('.menu-toggle');
 const navLinks = document.querySelector('.nav-links');

 menuToggle.addEventListener('click', () => {
     navLinks.classList.toggle('active');
     const spans = menuToggle.querySelectorAll('span');
     spans[0].style.transform = navLinks.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
     spans[1].style.opacity = navLinks.classList.contains('active') ? '0' : '1';
     spans[2].style.transform = navLinks.classList.contains('active') ? 'rotate(-45deg) translate(7px, -7px)' : 'none';
 });

 // JavaScript for Demo Request Popup
 document.addEventListener('DOMContentLoaded', function() {
     // Get the popup elements
     const popup = document.getElementById('demoRequestPopup');
     const closeBtn = document.querySelector('.close-popup');
     const demoBtn = document.querySelector('.btn-demo');
     const form = document.getElementById('demoRequestForm');
     
     // Open popup when demo button is clicked
     demoBtn.addEventListener('click', function() {
         popup.style.display = 'flex';
     });
     
     // Close popup when X is clicked
     closeBtn.addEventListener('click', function() {
         popup.style.display = 'none';
     });
     
     // Close popup when clicking outside of it
     window.addEventListener('click', function(event) {
         if (event.target === popup) {
             popup.style.display = 'none';
         }
     });
     
     // Form submission
     form.addEventListener('submit', function(event) {
         event.preventDefault();
         
         // Get form values
         const name = document.getElementById('name').value;
         const email = document.getElementById('email').value;
         const phone = document.getElementById('phone').value;
         const message = document.getElementById('message').value;

// Here you would typically send the form data to your server
console.log('Form submitted:', { name, email, phone, message });

// Show success message
alert('Thank you for your interest! We will contact you soon.');

// Reset form and close popup
form.reset();
popup.style.display = 'none';
});
});