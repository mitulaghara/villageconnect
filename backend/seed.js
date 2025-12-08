const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Notification = require('./models/Notification');

dotenv.config();

const users = [
    {
        name: 'Ramesh Patel',
        email: 'ramesh@example.com',
        password: 'password123',
        phone: '9876543210',
        village: 'Anandpur',
        role: 'user',
        token: 'token_ramesh_123'
    },
    {
        name: 'Suresh Kumar',
        email: 'suresh@example.com',
        password: 'password123',
        phone: '9876543211',
        village: 'Ratnapur',
        role: 'user',
        token: 'token_suresh_123'
    },
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
        phone: '9876543299',
        village: 'City Center',
        role: 'admin',
        token: 'token_admin_123'
    }
];

const products = [
    {
        title: 'Fresh Organic Tomatoes',
        description: 'Farm fresh organic tomatoes harvested this morning. No pesticides used.',
        price: 40,
        category: 'fresh_produce',
        contact: '9876543210',
        images: [], // In a real scenario, these would be filenames in uploads/
        userName: 'Ramesh Patel',
        userVillage: 'Anandpur',
        status: 'active'
    },
    {
        title: 'Handmade Bamboo Basket',
        description: 'Beautifully woven bamboo basket, strong and durable. Perfect for carrying vegetables.',
        price: 250,
        category: 'handicrafts',
        contact: '9876543210',
        images: [],
        userName: 'Ramesh Patel',
        userVillage: 'Anandpur',
        status: 'active'
    },
    {
        title: 'Pure Desi Ghee',
        description: 'Homemade pure cow ghee. made from A2 milk.',
        price: 1200,
        category: 'livestock',
        contact: '9876543211',
        images: [],
        userName: 'Suresh Kumar',
        userVillage: 'Ratnapur',
        status: 'active'
    },
    {
        title: 'Wheat Seeds (Grade A)',
        description: 'High quality wheat seeds for next season sowing. High yield variety.',
        price: 80,
        category: 'agriculture',
        contact: '9876543211',
        images: [],
        userName: 'Suresh Kumar',
        userVillage: 'Ratnapur',
        status: 'active'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villageconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Notification.deleteMany({});
        console.log('Cleared existing data');

        // Create Users
        const createdUsers = await User.insertMany(users);
        console.log('Users created:', createdUsers.length);

        // Assign userIds to products
        const ramesh = createdUsers.find(u => u.name === 'Ramesh Patel');
        const suresh = createdUsers.find(u => u.name === 'Suresh Kumar');

        const productsWithIds = products.map(p => {
            let user = p.userName === 'Ramesh Patel' ? ramesh : suresh;
            return {
                ...p,
                userId: user._id
            };
        });

        // Create Products
        const createdProducts = await Product.insertMany(productsWithIds);
        console.log('Products created:', createdProducts.length);

        // Create Notifications
        const notifications = createdProducts.map(p => ({
            message: `${p.userName} posted a new product: ${p.title}`,
            type: 'new_product',
            productId: p._id,
            createdAt: new Date()
        }));

        await Notification.insertMany(notifications);
        console.log('Notifications created');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDB();
