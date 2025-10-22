# PARROT ORDERING
◆
Online Campus Food Ordering Platform
◆

Sept. 2024 - Feb. 2025 | 3-Person Team Project
|
Flask · Python · SQLAlchemy · JavaScript · HTML/CSS · Bootstrap · SQLite
## Project Overview
Developed as a comprehensive web application for campus food ordering, Parrot Ordering is a full-stack platform that integrates multi-user role-based access control with complete ordering business workflows. The project explores modern web development by combining user authentication, real-time menu management, intelligent shopping cart systems, and social features within a responsive web environment. It was developed using Flask, SQLAlchemy, JavaScript, and Bootstrap, demonstrating full-stack web development capabilities with database design, API development, and user interface implementation.

## Core Features

### Multi-User System
- **Role-Based Access Control**: Three distinct user roles (Customer, Cook, Administrator) with specific permissions and functionalities
- **Secure Authentication**: User registration, login, and session management with password encryption using Werkzeug
- **Profile Management**: User profiles with avatar upload, personal information editing, and account management

### Menu Management
- **Daily Menu Publishing**: Cooks can publish daily menus with available dishes and quantities
- **Real-time Inventory**: Dynamic inventory tracking with automatic updates when orders are placed
- **Category Management**: Organized dish categories (Desserts, Fast Food, Beverages, Hot Dishes, Vegetarian)
- **Dish Management**: Complete CRUD operations for dishes with image upload and detailed descriptions

### Ordering System
- **Smart Shopping Cart**: Add, update, and remove items with quantity validation
- **Order Processing**: Complete order workflow from cart to submission with inventory updates
- **Order History**: Comprehensive order tracking and history for customers
- **Real-time Updates**: Dynamic menu availability and inventory management

### Social Features
- **Friend System**: Add friends, send friend requests, and manage friendships
- **Messaging System**: Real-time messaging between customers with conversation history
- **Review System**: Customer reviews for dishes with chef reply functionality
- **User Discovery**: Search and find other users in the platform

### Administrative Features
- **User Management**: Comprehensive user account management with ban/unban functionality
- **Menu Oversight**: Admin control over all menu items and categories
- **System Monitoring**: User activity tracking and system administration tools

## Technical Implementation

### Backend Architecture
- **Flask Framework**: RESTful API development with route handling and business logic
- **SQLAlchemy ORM**: Database modeling and relationship management with SQLite
- **Werkzeug Security**: Secure password hashing and file upload handling
- **Session Management**: User authentication and state management

### Frontend Development
- **JavaScript**: Dynamic content loading and AJAX asynchronous communication
- **HTML/CSS**: Responsive web design with Bootstrap framework
- **Interactive UI**: Real-time updates, form validation, and user interactions
- **Responsive Design**: Cross-platform compatibility for desktop and mobile devices

### Database Design
- **Relational Database**: Comprehensive data modeling with foreign key relationships
- **Data Integrity**: Transaction management and database consistency
- **Optimized Queries**: Efficient data retrieval and manipulation
- **Migration Support**: Database version control and schema updates

### File Management
- **Image Upload**: Avatar and dish image upload with secure file handling
- **Static Assets**: Organized static file management for images and stylesheets
- **File Validation**: Type checking and size validation for uploaded files

## Project Structure
```
ordering_parrot/
├── app.py                 # Main Flask application
├── models.py             # Database models and relationships
├── requirements.txt      # Python dependencies
├── run.py               # Application startup script
├── setup.py             # Automated setup script
├── templates/           # HTML templates
├── static/              # Static assets (CSS, JS, images)
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── uploads/        # User uploaded files
└── instance/           # Database files
```

## Key Technologies
- **Python 3.x**: Core programming language
- **Flask 3.1.2**: Web framework for backend development
- **SQLAlchemy 2.0.43**: ORM for database operations
- **JavaScript**: Frontend interactivity and AJAX communication
- **HTML5/CSS3**: Web markup and styling
- **Bootstrap**: Responsive UI framework
- **SQLite**: Database management system
- **Werkzeug 3.1.3**: Security utilities and file handling

## Development Process
This project was developed as a team effort with clear role distribution and collaborative development practices. The development process included:

1. **Planning Phase**: Requirements analysis, database design, and system architecture
2. **Development Phase**: Iterative development with feature implementation and testing
3. **Integration Phase**: System integration, bug fixing, and optimization
4. **Deployment Phase**: Final testing, documentation, and deployment preparation

## Project Outcomes

### Lessons Learned
This project encompasses the full stack of web application development—from database design and backend API development to frontend interface design and user experience optimization. It combines secure user authentication, efficient business logic, and responsive design to deliver a comprehensive and user-friendly ordering platform. Through this development process, the team gained hands-on experience in system architecture, database design, API development, and modern web technologies.

### Technical Achievements
- **Scalable Architecture**: Modular design supporting future feature expansion
- **Security Implementation**: Secure authentication and data protection
- **User Experience**: Intuitive interface with responsive design
- **Database Optimization**: Efficient queries and data relationships
- **Code Quality**: Clean, maintainable, and well-documented codebase

## Default Test Accounts
- **Administrator**: admin / admin123
- **Cook**: cook1 / cook123  
- **Customer**: customer1 / customer123

## Installation & Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run setup script: `python setup.py`
4. Start the application: `python run.py`
5. Access the platform at: `http://localhost:5000`

## Future Enhancements
- Payment integration for complete order processing
- Real-time notifications for order updates
- Advanced analytics and reporting features
- Mobile application development
- Integration with external delivery services
