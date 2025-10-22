document.addEventListener('DOMContentLoaded', (event) => {
            loadDishes();  // Load all dishes
            // loadTodayMenu();  // No longer needed as cook_menu.html directly displays backend data
            document.getElementById('dishForm').onsubmit = handleDishFormSubmit; // Set form submit handler
        });
// Load all dish list
function loadDishes() {
    fetch('/api/cook_dashboard')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(dishes => {
            console.log(dishes); // Output loaded dish data
            const menuList = document.getElementById('menu-list');
            menuList.innerHTML = ''; // Clear current menu
            dishes.forEach(dish => {
                const dishItem = document.createElement('div');
                dishItem.className = 'menu-item';
                dishItem.innerHTML = `  
                    <img src="${dish.image_url}" alt="${dish.dish_name}" />  
                    <h3>${dish.dish_name}</h3>  
                    <p>Category: ${dish.category}</p>  
                    <p>Price: $${dish.price}</p>  
                    <div class="dish-details">  
                        <label>  
                            Select for Today's Menu  
                            <input type="checkbox" name="dish_ids[]" value="${dish.dish_id}">  
                        </label>  
                        <label>  
                            Quantity:  
                            <input type="number" name="quantities[]" min="0" value="0">  
                        </label>  
                        <button type="button" onclick="toggleDescription(this, ${dish.dish_id})">View Description</button>
                        <div id="description-${dish.dish_id}" class="description" style="display: none;">
                            <p>${dish.description}</p>
                        </div>
                    </div>
                `;
                menuList.appendChild(dishItem);
            });
        })
        .catch(error => console.error('Error loading dishes:', error));
}


// Toggle description display and hide
function toggleDescription(button, dishId) {
    const descriptionElement = document.getElementById('description-' + dishId);
    if (descriptionElement.style.display === 'none') {
        descriptionElement.style.display = 'block';
        button.textContent = 'Hide Description';
    } else {
        descriptionElement.style.display = 'none';
        button.textContent = 'View Description';
    }
}


// Handle form submission, submit selected dishes and quantities to server
function submitMenu() {
    const formData = new FormData();
    const dishItems = document.querySelectorAll('.menu-item');

    dishItems.forEach(dishItem => {
        const checkbox = dishItem.querySelector('input[name="dish_ids[]"]');
        const quantityInput = dishItem.querySelector('input[name="quantities[]"]');

        if (checkbox && checkbox.checked) {
            const quantity = quantityInput ? quantityInput.value : 0;
            if (quantity > 0) {
                formData.append('dish_ids[]', checkbox.value);
                formData.append('quantities[]', quantity);
            } else {
                alert(`Please enter a valid quantity for ${checkbox.value}`);
            }
        }
    });

    if (formData.has('dish_ids[]')) {
        fetch('/cook_dashboard', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => { throw new Error(data.message); });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            // Jump to Today's Menu page to view submitted dishes
            window.location.href = '/cook_menu';
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while submitting the menu: " + error.message);
        });
    } else {
        alert('Please select at least one dish and enter a valid quantity.');
    }
}


// Loads and displays the chef's menu of the day
function loadTodayMenu() {
    fetch('/api/cook_menu')
        .then(response => response.json())
        .then(dishes => {
            const todayMenuSection = document.getElementById('today-menu');
            todayMenuSection.innerHTML = ''; // Clear current content
            if (dishes.length > 0) {
                todayMenuSection.innerHTML = '<h2>Your Menu for Today:</h2>';
                dishes.forEach(dish => {
                    const dishItem = document.createElement('div');
                    dishItem.className = 'dish-item';
                    dishItem.innerHTML = `
                        <img src="${dish.image_url}" alt="${dish.dish_name}" />
                        <h3>${dish.dish_name}</h3>
                        <p>Category: ${dish.category}</p>
                        <p>Price: $${dish.price}</p>
                        <label>Quantity: ${dish.quantity}</label>
                        <button type="button" onclick="toggleDescription(this, ${dish.dish_id})">View Description</button>
                        <div id="description-${dish.dish_id}" class="description" style="display: none;">
                            <p>${dish.description}</p>
                        </div>
                    `;
                    todayMenuSection.appendChild(dishItem);
                });
            } else {
                todayMenuSection.innerHTML = '<p>You have not selected any dishes for today.</p>';
            }
        })
        .catch(error => console.error('Error loading today\'s menu:', error));
}


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
    // Remove all existing themes and theme variants
    document.body.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme', 'theme-1', 'theme-2', 'theme-3');
    
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
            element.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme', 'theme-1', 'theme-2', 'theme-3');
            element.classList.add(theme + '-theme');
        }
    });

    // Handle animal theme variants
    if (theme === 'animal') {
        // Check if user has a specific animal theme preference
        const animalThemeVariant = localStorage.getItem('animalThemeVariant') || 'theme-1';
        document.body.classList.add(animalThemeVariant);
    }

    // Store the selected theme in localStorage
    localStorage.setItem('masterTheme', theme);
}

// Function to switch animal theme background
function switchAnimalTheme(variant) {
    if (document.body.classList.contains('animal-theme')) {
        document.body.classList.remove('theme-1', 'theme-2', 'theme-3');
        document.body.classList.add(variant);
        localStorage.setItem('animalThemeVariant', variant);
    }
}

// Handle theme change from a select dropdown or button
function changeTheme() {
    const theme = document.getElementById('theme').value;

    // Apply the new theme globally
    switchTheme(theme);
}
