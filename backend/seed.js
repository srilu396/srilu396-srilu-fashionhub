const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const Message = require('./models/Message');
const Order = require('./models/Order');
const User = require('./models/User');

const initialProducts = [
  {
    name: "Plaid Straight Skirt",
    price: 45.99,
    originalPrice: 59.99,
    category: "Women's",
    subCategory: "Skirts",
    description: "This is a pink plaid midi skirt featuring a subtle bow detail and a flattering, form-fitting silhouette.",
    images: [
      "https://img105.savana.com/v1/goods-pic/f782ab43ea484492b2bb20f30c0f0696_w1440_q90.webp",
      "https://www.fashionchingu.com/wp-content/uploads/2026/05/Pink-Gingham-Ruffle-Midi-Skirt-Moka-ILLIT_desc_9.jpg",
      "https://assets.myntassets.com/assets/images/2026/APRIL/6/utxmFx45_020a50e3f3c14055a63ce1a6b5c2f9f1.jpg"
    ],
    rating: 4.8,
    stock: 15,
    featured: true
  },
  {
    name: "Printed Straight Skirt",
    price: 11.68,
    originalPrice: 15.99,
    category: "Women's",
    subCategory: "Skirts",
    description: "This elegant printed straight skirt features a vibrant abstract design in shades of blue and green, crafted with a flattering midi-length hem.",
    images: [
      "https://img105.savana.com/v1/goods-pic/87b0c2ede8ba42f8bb4c2d38467b7d71UR_w1440_q90.webp",
      "https://img.ltwebstatic.com/images3_pi/2024/01/05/89/17044213957200390ae82655a7929f5f4dd86b40fc_thumbnail_405x552.jpg"
    ],
    rating: 5.0,
    stock: 10,
    featured: true
  },
  {
    name: "Tie Up A-Line Skirt",
    price: 20.00,
    originalPrice: 28.00,
    category: "Women's",
    subCategory: "Skirts",
    description: "This chic black mini wrap skirt features a stylish side tie-knot and a sleek, straight hem for a versatile and modern look.",
    images: [
      "https://img105.savana.com/goods-pic/0275d6406bcc4d2cb4e4184f03826ad1_w540_h720_q85.webp",
      "https://i.pinimg.com/736x/1a/3b/d8/1a3bd8b441498878a4eca83d2af13952.jpg"
    ],
    rating: 4.3,
    stock: 14,
    featured: true
  },
  {
    name: "Ruffle A-Line Skirt",
    price: 8.84,
    originalPrice: 12.50,
    category: "Women's",
    subCategory: "Skirts",
    description: "This feminine and flirty pink mini skirt features a playful ruffle hem and a flattering A-line silhouette.",
    images: [
      "https://img105.savana.com/v1/goods-pic/16b1c02f49d545ef9cb1cd9743957920_w360.webp"
    ],
    rating: 4.0,
    stock: 5,
    featured: true
  },
  {
    name: "Cream-Colored Maxi Skirt",
    price: 30.00,
    originalPrice: 42.00,
    category: "Women's",
    subCategory: "Skirts",
    description: "This elegant cream-colored, high-rise maxi skirt features an intricate lace crochet design with a flowy A-line silhouette.",
    images: [
      "https://assets.newme.asia/wp-content/uploads/2026/01/0817183519e839d0/NM-PRC-152-SKT-26-JAN-29977-CREAM(3)-533x800.webp"
    ],
    rating: 4.5,
    stock: 12,
    featured: true
  },
  {
    name: "Classic Chocolate Brown Coat",
    price: 60.00,
    originalPrice: 85.00,
    category: "Women's",
    subCategory: "Coats",
    description: "A classic, minimalist women's long coat in a rich chocolate brown shade.",
    images: [
      "https://i.pinimg.com/736x/4b/45/3e/4b453e2bf3922d785f8126bb14dda2eb.jpg"
    ],
    rating: 4.2,
    stock: 8,
    featured: true
  },
  {
    name: "maroon solid casual shirt",
    price: 29.99,
    originalPrice: 39.99,
    category: "Men's",
    subCategory: "Shirts & T-shirts",
    description: "This maroon solid casual shirt is crafted from a cotton linen blend for breathable comfort.",
    images: [
      "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/25670574/2023/10/28/879061ea-a623-4d1b-915d-14f3ed921d471698498562222TheSouledStoreMenRedOpaqueCasualShirt1.jpg"
    ],
    rating: 4.2,
    stock: 10,
    featured: true
  },
  {
    name: "textured orange casual shirt",
    price: 43.99,
    originalPrice: 55.00,
    category: "Men's",
    subCategory: "Shirts & T-shirts",
    description: "This textured orange casual shirt features a mandarin collar and long sleeves.",
    images: [
      "https://auraalooks.com/cdn/shop/files/IMG_1427.png?v=1778588452&width=3840"
    ],
    rating: 4.4,
    stock: 6,
    featured: true
  }
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srilu_fashion_hub_db';
    console.log(`🔌 Connecting to MongoDB (Database: srilu_fashion_hub_db)...`);
    await mongoose.connect(mongoUri, { dbName: 'srilu_fashion_hub_db' });

    console.log('🌱 Checking collection counts before seeding...');
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const couponCount = await Coupon.countDocuments();
    const messageCount = await Message.countDocuments();

    console.log(`Users: ${userCount}, Products: ${productCount}, Coupons: ${couponCount}, Messages: ${messageCount}`);

    if (productCount === 0) {
      console.log('👗 Seeding initial products...');
      await Product.insertMany(initialProducts);
      console.log('✅ Products seeded successfully');
    }

    // Seed default User if missing
    const defaultUserEmail = 'user@srilufashionhub.com';
    let existingUser = await User.findOne({ email: defaultUserEmail });
    if (!existingUser) {
      console.log('👤 Seeding default user...');
      existingUser = new User({
        username: 'default_user',
        email: defaultUserEmail,
        password: 'user123',
        firstName: 'Sophia',
        lastName: 'Loren',
        role: 'user',
        phone: '+91 9391207207',
        address: {
          street: '123 Couture Fashion St',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          zipCode: '500081'
        }
      });
      await existingUser.save();
      console.log(`✅ Default user created: ${defaultUserEmail}`);
    }

    if (couponCount === 0) {
      console.log('🎟️ Seeding initial coupons...');
      await Coupon.insertMany([
        {
          coupon_code: 'WELCOME10',
          discount_type: 'percentage',
          discount_value: 10,
          description: '10% Off Welcome Discount',
          valid_from: new Date(),
          valid_until: new Date('2026-12-31'),
          active_status: true,
          min_cart_value: 50
        },
        {
          coupon_code: 'LUXURY20',
          discount_type: 'fixed',
          discount_value: 20,
          description: '$20 Off Luxury Collection',
          valid_from: new Date(),
          valid_until: new Date('2026-12-31'),
          active_status: true,
          min_cart_value: 100
        }
      ]);
      console.log('✅ Coupons seeded successfully');
    }

    if (messageCount === 0) {
      console.log('✉️ Seeding initial customer messages...');
      await Message.insertMany([
        {
          name: 'Sophia Loren',
          email: 'sophia@example.com',
          subject: 'Inquiry on Silk Gown',
          message: 'Hello, I would like to know if the silk gown comes in navy blue size M.',
          read: false
        }
      ]);
      console.log('✅ Messages seeded successfully');
    }

    console.log('🎉 Seeding check completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();

