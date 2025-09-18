document.addEventListener('DOMContentLoaded', (event) => {
    loadMenu(); // Load menu on page load
    document.getElementById('dishForm').onsubmit = handleDishFormSubmit; // Set up form submission handler
});

// Global variable to store all dishes
let allDishes = [];

// Function to load the menu items
function loadMenu() {
    fetch('/menu')
        .then(response => response.json())
        .then(dishes => {
            allDishes = dishes; // Save all dishes to the global variable
            displayMenu(dishes); // Display all dishes by default
        })
        .catch(error => console.error('Error loading menu:', error));
}

// Function to display menu based on the dishes passed
function displayMenu(dishes) {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = ''; // Clear the current list

    dishes.forEach(dish => {
        const dishItem = document.createElement('div');
        dishItem.className = 'menu-item';
        dishItem.innerHTML = `    
            <img src="${dish.image_url}" alt="${dish.name}" />  
            <h3>${dish.name}</h3>  
            <p>Category: ${dish.category}</p>  
            <p>Price: $${dish.price}</p>  
            <button onclick="toggleDescription(${dish.id})">View Description</button>  
            <div id="description-${dish.id}" class="description" style="display: none;">
                <p>${dish.description}</p>
            </div>
            <button onclick="deleteDish(${dish.id})">Delete</button>  
        `;
        menuList.appendChild(dishItem);
    });
}

// Function to filter the menu based on category
function filterMenu(category) {
    // Reset button states
    const buttons = document.querySelectorAll('#category-buttons button');
    buttons.forEach(button => {
        button.classList.remove('selected'); // Remove 'selected' class from all buttons
    });

    if (category === 'View All') {
        displayMenu(allDishes); // Show all dishes
    } else {
        const filteredDishes = allDishes.filter(dish => dish.category === category);
        displayMenu(filteredDishes); // Display filtered dishes
    }

    // Highlight the selected category button
    const selectedButton = Array.from(buttons).find(button => button.textContent === category);
    if (selectedButton) {
        selectedButton.classList.add('selected'); // Add 'selected' class to the clicked button
    }
}

// Function to handle dish form submission
function handleDishFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this); // Create FormData object from the form

    fetch('/add_dish', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show success or error message
        if (data.message === "Added a new dish successfully") {
            loadMenu(); // Reload the menu
            toggleDishForm(); // Hide the form after submission
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred while adding the dish. Please try again.");
    });
}

// Function to toggle the dish form visibility
function toggleDishForm() {
    const form = document.getElementById('create-dish-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Function to toggle the visibility of the dish description
function toggleDescription(dishId) {
    const description = document.getElementById(`description-${dishId}`);
    description.style.display = description.style.display === 'none' ? 'block' : 'none';
}

// Function to delete a dish
function deleteDish(dishId) {
    if (!confirm("Are you sure you want to delete this dish?")) {
        return;
    }
    fetch(`/delete_dish/${dishId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show the success message
        loadMenu(); // Reload the menu after deletion
    })
    .catch(error => {
        console.error('Error deleting dish:', error);
        alert("An error occurred while deleting the dish. Please try again.");
    });
}

// Function to show the dish creation form when "Create a new dish" is clicked
function createNewDish() {
    toggleDishForm(); // Show or hide the create dish form
}

// Call loadMenu on page load to display all dishes by default
document.addEventListener('DOMContentLoaded', () => {
    loadMenu(); // Load all dishes on initial page load
});

// Function to handle search functionality
function searchDishes(query) {
    // Filter dishes based on the search query
    const filteredDishes = allDishes.filter(dish =>
        dish.name.toLowerCase().includes(query.toLowerCase())
    );
    displayMenu(filteredDishes); // Display filtered dishes
}

// Event listener for the search button
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-box').value;
    searchDishes(query); // Call the search function with the query
});

// Event listener for the 'Enter' key to trigger the search (optional but useful for user experience)
document.getElementById('search-box').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const query = event.target.value;
        searchDishes(query); // Trigger search when 'Enter' is pressed
    }
});

window.onload = function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Apply saved theme to body and all relevant sections
        document.body.classList.add(savedTheme + '-theme');

        const sections = ['nav', 'header', '.search-bar', 'footer', '.menu-list', '.admin-profile-container'];
        sections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add(savedTheme + '-theme');
            }
        });

        const themeSelector = document.getElementById('theme');
        if (themeSelector) {
            themeSelector.value = savedTheme;
        }
    }
};


// Switch theme across the page
function switchTheme(theme) {
    // Remove all existing themes
    document.body.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme');
    
    const elementsToUpdate = [
        document.body, 
        document.querySelector('nav'), 
        document.querySelector('header'),
        document.querySelector('.search-bar'),
        document.querySelector('footer'),
        document.querySelector('.menu-list'),
        document.querySelector('.admin-profile-container')
    ];

    // Add the new theme class
    elementsToUpdate.forEach(element => {
        if (element) {
            element.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme');
            element.classList.add(theme + '-theme');
        }
    });

    // Store the selected theme in localStorage
    localStorage.setItem('theme', theme);
}

// Handle theme change from a select dropdown or button
function changeTheme() {
    const theme = document.getElementById('theme').value;

    // Apply the new theme globally
    switchTheme(theme);
}
