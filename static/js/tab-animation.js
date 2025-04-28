document.addEventListener('DOMContentLoaded', function() {
    // Get all tab links
    const tabLinks = document.querySelectorAll('.tabs__link, .tabs__link--isActive');
    
    // Add click event listener to each tab
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabLinks.forEach(tab => {
                if (tab.classList.contains('tabs__link--isActive')) {
                    tab.classList.remove('tabs__link--isActive');
                    tab.classList.add('tabs__link');
                }
            });
            
            // Add active class to clicked tab
            this.classList.remove('tabs__link');
            this.classList.add('tabs__link--isActive');
            
            // Get the category from data attribute
            const category = this.getAttribute('data-categoria');
            
            // Get all tab content
            const activeContent = document.querySelector('.tab-content.active');
            
            if (activeContent) {
                // Add fadeOut animation class
                activeContent.classList.add('fade-out');
                
                // Wait for animation to complete before changing content
                setTimeout(() => {
                    // Remove active class
                    activeContent.classList.remove('active');
                    activeContent.classList.remove('fade-out');
                    
                    // Load new content based on category
                    loadCategoryBooks(category);
                }, 300); // Match the animation duration
            } else {
                // If no active content, just load new content
                loadCategoryBooks(category);
            }
        });
    });
    
    // Function to load books by category (to be implemented in your main.js)
    function loadCategoryBooks(category) {
        // This function should be defined in your main.js
        // We'll trigger it if it exists
        if (typeof window.loadBooksByCategory === 'function') {
            window.loadBooksByCategory(category);
        } else {
            console.log('Loading books for category:', category);
            // For testing purposes, we'll create a mock container
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `<div class="tab-content active">
                    <h3>Books in category: ${category}</h3>
                    <p>Content is loading...</p>
                </div>`;
            }
        }
    }
    
    // Trigger click on the first tab to load initial content
    if (tabLinks.length > 0 && !document.querySelector('.tab-content.active')) {
        setTimeout(() => {
            tabLinks[0].click();
        }, 100);
    }
});
