from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import date
from datetime import datetime
from sqlalchemy import UniqueConstraint

db = SQLAlchemy()
migrate = Migrate()

# Define User model
class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    introduction = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)

    customer = db.relationship('Customer', back_populates='user', cascade='all, delete', uselist=False)
    cook = db.relationship('Cook', back_populates='user', cascade='all, delete', uselist=False)
    administrator = db.relationship('Administrator', back_populates='user', cascade='all, delete', uselist=False)


# Define Customer model
class Customer(db.Model):
    customer_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.user_id', ondelete='CASCADE', name='fk_customer_user_id'),
        nullable=False
    )
    user = db.relationship('User', back_populates='customer')


# Define Cook model
class Cook(db.Model):
    cook_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.user_id', ondelete='CASCADE', name='fk_cook_user_id'),
        nullable=False
    )
    category = db.Column(db.String(50), nullable=False, default='')
    user = db.relationship('User', back_populates='cook')


# Define Administrator model
class Administrator(db.Model):
    admin_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.user_id', ondelete='CASCADE', name='fk_admin_user_id'),
        nullable=False
    )
    user = db.relationship('User', back_populates='administrator')


# Define Dish model
class Dish(db.Model):
    dish_id = db.Column(db.Integer, primary_key=True)
    dish_name = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)

class Menu(db.Model):
    __tablename__ = 'menu'
    menu_id = db.Column(db.Integer, primary_key=True)
    cook_id = db.Column(db.Integer, db.ForeignKey('cook.cook_id'), nullable=False)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.dish_id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    __table_args__ = (UniqueConstraint('dish_id', 'date', name='_dish_date_uc'),)

    cook = db.relationship('Cook', backref=db.backref('menus', lazy=True))
    dish = db.relationship('Dish', backref=db.backref('menus', lazy=True))

class ShoppingCartItem(db.Model):
    cart_item_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.dish_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    dish = db.relationship('Dish')
    customer = db.relationship('Customer', backref=db.backref('cart_items', lazy=True))


# Add order model
class Order(db.Model):
    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    total_price = db.Column(db.Float, nullable=False)
    # Relationships
    customer = db.relationship('Customer', backref=db.backref('orders', lazy=True))


class OrderItem(db.Model):
    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.order_id'), nullable=False)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.dish_id'), nullable=False)
    cook_id = db.Column(db.Integer, db.ForeignKey('cook.cook_id'), nullable=False)  # New
    quantity = db.Column(db.Integer, nullable=False)

    order = db.relationship('Order', backref=db.backref('order_items', lazy=True))
    dish = db.relationship('Dish')
    cook = db.relationship('Cook')


class DishReview(db.Model):
    review_id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_item.order_item_id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)
    cook_id = db.Column(db.Integer, db.ForeignKey('cook.cook_id'), nullable=False)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.dish_id'), nullable=False)
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order_item = db.relationship('OrderItem', backref=db.backref('review', uselist=False))
    customer = db.relationship('Customer', backref=db.backref('reviews', lazy=True))
    cook = db.relationship('Cook', backref=db.backref('reviews', lazy=True))
    dish = db.relationship('Dish', backref=db.backref('reviews', lazy=True))



class Friendship(db.Model):
    friendship_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # 'Pending', 'Accepted', 'Rejected'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    customer = db.relationship('Customer', foreign_keys=[customer_id], backref=db.backref('friend_requests', lazy=True))
    friend = db.relationship('Customer', foreign_keys=[friend_id], backref=db.backref('friends', lazy=True))


class Message(db.Model):
    message_id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)  # Message sender
    receiver_id = db.Column(db.Integer, db.ForeignKey('customer.customer_id'), nullable=False)  # Message receiver
    content = db.Column(db.Text, nullable=False)  # Message content
    is_read = db.Column(db.Boolean, default=False)  # Read or not
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    sender = db.relationship('Customer', foreign_keys=[sender_id], backref=db.backref('sent_messages', lazy=True))
    receiver = db.relationship('Customer', foreign_keys=[receiver_id], backref=db.backref('received_messages', lazy=True))

class ChefReply(db.Model):
    reply_id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('dish_review.review_id'), nullable=False)
    cook_id = db.Column(db.Integer, db.ForeignKey('cook.cook_id'), nullable=False)
    reply_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    review = db.relationship('DishReview', backref=db.backref('replies', lazy=True))
    cook = db.relationship('Cook', backref=db.backref('replies', lazy=True))
