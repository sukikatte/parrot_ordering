// static/js/customer_dashboard.js

function loadDishesAjax() {
    fetch('/api/customer_menu')
        .then(response => {
            if(!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // data[{cook_name: 'X', dishes: [ {...}, {...} ]}, ...]
            const container = document.getElementById('menu-container');
            container.innerHTML = '';

            data.forEach(chefGroup => {
                const section = document.createElement('div');
                section.className = 'chef-section';

                const heading = document.createElement('h2');
                heading.textContent = `Dishes by Chef: ${chefGroup.cook_name}`;
                section.appendChild(heading);

                const dishGrid = document.createElement('div');
                dishGrid.className = 'dish-grid';

                chefGroup.dishes.forEach(dish => {
                    const dishItem = document.createElement('div');
                    dishItem.className = 'dish';

                    dishItem.innerHTML = `
                        <img src="${dish.image_url}" alt="${dish.dish_name}">
                        <h3>${dish.dish_name}</h3>
                        <p>Category: ${dish.category}</p>
                        <p>Price: $${dish.price}</p>
                        <p>Available: ${dish.quantity}</p>
                        <p>Cooked by: ${dish.cook_name}</p>
                    `;

                    if (dish.quantity > 0) {
                        dishItem.innerHTML += `
                            <input type="number" id="quantity_${dish.dish_id}" value="1" min="1" max="${dish.quantity}">
                            <button onclick="addToCart('${dish.dish_id}')">Add to Cart</button>
                        `;
                    } else {
                        dishItem.innerHTML += `<p style="color: red; font-weight: bold;">Out of Stock</p>`;
                    }

                    // Modify the View Description button to link to a new page
                    dishItem.innerHTML += `<a href="/dish/${dish.dish_id}" class="view-description-btn">View Description</a>`;

                    dishGrid.appendChild(dishItem);
                });

                section.appendChild(dishGrid);
                container.appendChild(section);
            });
        })
        .catch(error => {
            console.error('Error loading dishes:', error);
        });
}

function addToCart(dishId) {
    const quantityInput = document.getElementById('quantity_' + dishId);
    let quantity = parseInt(quantityInput.value);
    const maxQuantity = parseInt(quantityInput.getAttribute('max'));

    if (quantity > maxQuantity) {
        alert(`The number of selections exceeds the number available. A maximum of ${maxQuantity} can be selected`);
        quantityInput.value = maxQuantity;
        quantity = maxQuantity;
    }

    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dish_id: dishId, quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}

function viewCart() {
    window.location.href = '/view_cart';
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
