document.addEventListener('DOMContentLoaded', function () {
    const messagesTab = document.getElementById('messages-tab');
    const newFriendsTab = document.getElementById('new-friends-tab');
    const addFriendsTab = document.getElementById('add-friends-tab');

    const messagesList = document.getElementById('messages-list');
    const newFriendsList = document.getElementById('new-friends-list');
    const addFriendsList = document.getElementById('add-friends-list');

    const messagesContainer = document.getElementById('messages-container');
    const newFriendsContainer = document.getElementById('new-friends-container');
    const searchResult = document.getElementById('search-result');
    const searchUsername = document.getElementById('search-username');
    const searchBtn = document.getElementById('search-btn');

    const messageDetailsContainer = document.getElementById('message-details-container');
    const backToMessagesBtn = document.getElementById('back-to-messages');
    const friendAvatar = document.getElementById('friend-avatar');
    const friendUsername = document.getElementById('friend-username');
    const messageHistory = document.getElementById('message-history');
    const replyBtn = document.getElementById('reply-btn');
    const replySection = document.getElementById('reply-section'); // 回复区域
    const replyInput = document.getElementById('reply-input'); // 输入框
    const avatarImg = document.querySelector('#reply-section .reply-body img'); // 回复框中的头像元素

    const sendBtn = document.getElementById('send-btn'); // 发送按钮

    let customerAvatar = '/static/images/default_avatar.png'; // 默认头像路径
    let friendId = null; // 全局变量，存储当前聊天对象的 ID

    // Dynamically get the customer ID from the dataset
    const customerId = document.body.dataset.customerId;
    if (!customerId) {
        console.error('Customer ID not found!');
        alert('Error: Unable to find your customer ID. Please reload the page.');
        return;
    }
    console.log(`Customer ID retrieved: ${customerId}`);

    // Tab navigation
    function showTab(tab) {
        // 隐藏所有 tab 内容
        [messagesList, newFriendsList, addFriendsList, messageDetailsContainer].forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none'; // 确保隐藏
        });
        // 显示目标 tab
        tab.classList.remove('hidden');
        tab.style.display = 'block'; // 确保显示
    }


    messagesTab.addEventListener('click', () => {
        showTab(messagesList);
        loadMessages();
    });

    newFriendsTab.addEventListener('click', () => {
        showTab(newFriendsList);
        loadNewFriends();
    });

    addFriendsTab.addEventListener('click', () => {
        showTab(addFriendsList);
    });

    // Load messages
    function loadMessages() {
        fetch(`/messages/${customerId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load messages');
                }
                return response.json();
            })
            .then(data => {
                if (data.empty) {
                    messagesContainer.innerHTML = '<p>You haven\'t received any messages</p>';
                } else {
                    messagesContainer.innerHTML = '';
                    data.messages.forEach(msg => {
                        const messageItem = document.createElement('div');
                        messageItem.className = 'message-item';
                        messageItem.addEventListener('click', () => loadMessageDetails(msg.friend_id));
                        messageItem.innerHTML = `
                            <img src="${msg.friend_avatar || '/static/images/default_avatar.png'}" alt="${msg.friend_username}">
                            <div class="message-content">
                                <div class="text-content">
                                    <p class="username">${msg.friend_username}</p>
                                    <p class="message-text">${msg.content}</p>
                                </div>
                                <small class="timestamp">${msg.created_at}</small>
                            </div>
                        `;
                        messagesContainer.appendChild(messageItem);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading messages:', error);
                messagesContainer.innerHTML = '<p>Error loading messages. Please try again later.</p>';
            });
    }


    // Load message details
    function loadMessageDetails(id) {
        friendId = id; // 设置当前聊天对象的 friendId
        fetch(`/message_details/${friendId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Response from server:', data); // Debugging output
                if (data.empty) {
                    alert('No messages found');
                    return;
                }

                console.log('Switching to message details tab...');

                // Hide message list and show message details
                showTab(messageDetailsContainer);

                // 检查容器的类和样式
                console.log('Message Details Container Class:', messageDetailsContainer.classList);
                console.log('Message Details Container Style:', messageDetailsContainer.style);


                // Update friend info
                friendUsername.textContent = data.friend_username;

                // Load message history
                messageHistory.innerHTML = '';
                data.messages.forEach(msg => {
                    console.log('Rendering message:', msg);

                    const messageItem = document.createElement('div');
                    messageItem.className = 'message-item';

                    messageItem.innerHTML = `
                        <img src="${msg.sender_avatar || '/static/images/default_avatar.png'}" alt="${msg.sender_username}" class="message-avatar">
                        <div class="message-content">
                            <p class="username">${msg.sender_username}</p>
                            <p class="message-text">${msg.content}</p>
                            <small class="timestamp">${msg.created_at}</small>
                        </div>
                    `;
                    messageHistory.appendChild(messageItem);
                });
            })
            .catch(error => console.error('Error loading message details:', error));
    }

    // Back to messages list
    backToMessagesBtn.addEventListener('click', () => {
        showTab(messagesList); // 显示消息列表页
        loadMessages();  // 重新加载消息列表
    });

    // Reply button functionality
    replyBtn.addEventListener('click', () => {
        const replyFriendUsername = document.getElementById('reply-friend-username');
        replyFriendUsername.textContent = friendUsername.textContent; // Set friend username

        if (replySection.classList.contains('visible')) {
            replySection.classList.remove('visible'); // Hide
        } else {
            // Get bounding rectangle of the Reply button
            const btnRect = replyBtn.getBoundingClientRect();

            // Set the position of the reply section
            replySection.style.top = `${btnRect.bottom + window.scrollY + 10}px`; // 10px gap below the button
            replySection.style.left = `${btnRect.left}px`; // Align left with Reply button
            replySection.style.width = `900px`;
            replySection.style.maxWidth = `90%`;
            replySection.classList.add('visible'); // Show the section
        }
    });

    const closeReplyBtn = document.getElementById('close-reply');
    closeReplyBtn.addEventListener('click', () => {
        const replySection = document.getElementById('reply-section');
        replySection.classList.add('hidden');
    });

    // Fetch the current customer's avatar
    fetch(`/get_customer_avatar/${customerId}`)
        .then(response => response.json())
        .then(data => {
            customerAvatar = data.avatar || '/static/images/default_avatar.png';
            avatarImg.src = customerAvatar; // 设置编辑框中的头像
        })
        .catch(error => console.error('Error fetching customer avatar:', error));

    sendBtn.addEventListener('click', () => {
        const replyInput = document.getElementById('reply-input');
        const messageContent = replyInput.value.trim();

        if (!messageContent) {
            alert('Message cannot be empty!');
            return;
        }

        fetch(`/send_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: messageContent,
                sender_id: customerId, // user ID
                receiver_id: friendId // friend ID
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 清空输入框
                replyInput.value = '';
                // 隐藏回复区域
                replySection.classList.remove('visible');
                // 重新加载所有消息历史
                loadMessageDetails(friendId);
            } else {
                alert('Failed to send message!');
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message, please try again.');
        });
    });


    // Load new friends
    function loadNewFriends() {
        fetch(`/new_friends/${customerId}`) // Dynamically use customer_id
            .then(response => response.json())
            .then(data => {
                newFriendsContainer.innerHTML = '';
                if (data.requests.length === 0) {
                    newFriendsContainer.innerHTML = '<p>No new friend requests</p>';
                } else {
                    data.requests.forEach(request => {
                        const avatar = request.avatar || '/static/images/default_avatar.png';
                        const friendItem = document.createElement('div');
                        friendItem.className = 'friend-item';
                        friendItem.innerHTML = `
                            <img src="${avatar}" alt="${request.username}">
                            <p>${request.username}</p>
                            <button
                                class="accept-button"
                                data-friendship-id="${request.friendship_id}"
                                ${request.status === 'Accepted' ? 'disabled' : ''}
                                style="${request.status === 'Accepted' ? 'background-color: #ccc; cursor: default;' : ''}"
                            >
                                ${request.status === 'Accepted' ? 'Accepted' : 'Accept'}
                            </button>
                        `;
                        newFriendsContainer.appendChild(friendItem);

                        // Add event listener for "Accept" button
                        if (request.status !== 'Accepted') {
                            const button = friendItem.querySelector('.accept-button');
                            button.addEventListener('click', () => acceptFriend(button, request.friendship_id));
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading new friends:', error);
                alert('Error loading new friend requests. Please try again later.');
            });
    }

    // Accept friend request
    function acceptFriend(button, friendshipId) {
        button.disabled = true; // Disable the button
        button.textContent = 'Processing...'; // Show a processing state
        fetch(`/accept_friend/${friendshipId}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Accepted') {
                    button.textContent = 'Accepted';
                    button.disabled = true;
                    button.style.backgroundColor = '#ccc'; // Change button color to gray
                    button.style.cursor = 'default'; // Change cursor style to default
                    loadMessages(); // Refresh the messages
                } else {
                    alert(data.message);
                    button.disabled = false; // Re-enable the button
                    button.textContent = 'Accept'; // Reset text
                }
            })
            .catch(error => {
                console.error('Error accepting friend request:', error);
                alert('Error accepting friend request. Please try again later.');
                button.disabled = false; // Re-enable the button
                button.textContent = 'Accept';
            });
    }

    // Search and add friend
    searchBtn.addEventListener('click', () => {
        searchBtn.disabled = true; // Disable button
        searchBtn.textContent = 'Searching...'; // Show loading state
        fetch('/search_customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: searchUsername.value })
        })
            .then(response => response.json())
            .then(data => {
                searchResult.innerHTML = '';
                if (data.found) {
                    const avatar = data.avatar || '/static/images/default_avatar.png'; // Use default avatar
                    searchResult.innerHTML = `
                        <div class="friend-item">
                            <img src="${data.avatar}" alt="${data.username}">
                            <p>${data.username}</p>
                            <button onclick="addFriend(this, ${data.customer_id})">Add</button>
                        </div>
                    `;
                } else {
                    searchResult.innerHTML = '<p>This customer could not be found</p>';
                }
            })
            .catch(error => {
                console.error('Error searching customer:', error);
                alert('Error searching for customer. Please try again later.');
            })
            .finally(() => {
                searchBtn.disabled = false; // Re-enable button
                searchBtn.textContent = 'Search';
            });
    });

    window.addFriend = function (button, friendId) {
        button.disabled = true; // 禁用按钮
        button.textContent = 'Processing...'; // 显示加载提示
        fetch('/add_friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: customerId, friend_id: friendId }) // 动态使用 customer_id
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error('Error adding friend:', error);
                alert('Error adding friend. Please try again later.');
            })
            .finally(() => {
                button.disabled = false; // 恢复按钮
                button.textContent = 'Add';
            });
    };

    // Initialize
    loadMessages();
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
