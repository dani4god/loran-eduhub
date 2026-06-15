// scripts/create-super-admin.mjs
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Define schemas directly in the script to avoid import issues
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], required: true },
  isActive: { type: Boolean, default: true },
  firstName: { type: String },
  lastName: { type: String },
  discordId: { type: String },
  discordUsername: { type: String },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
  permissions: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createSuperAdmin() {
  try {
    console.log('\n🔐 SUPER ADMIN CREATION TOOL\n');
    console.log('This will create a super admin account with full system access.\n');

    // Get admin details
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const phone = await question('Phone Number: ');
    const password = await question('Password (min 8 chars): ');
    const confirmPassword = await question('Confirm Password: ');

    // Validate inputs
    if (!firstName || !lastName || !email || !phone || !password) {
      console.error('\n❌ All fields are required');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.error('\n❌ A super admin already exists!');
      console.log('You can only have one super admin account.');
      process.exit(1);
    }

    // Check if user with email exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('\n⚠️ User with this email already exists.');
      const createNew = await question('Do you want to make this user an admin? (yes/no): ');
      
      if (createNew.toLowerCase() !== 'yes') {
        console.log('\n❌ Operation cancelled');
        process.exit(1);
      }
    } else {
      // Create new user
      console.log('\n👤 Creating user account...');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        firstName,
        lastName,
        emailVerified: true,
      });
      console.log('✅ User account created');
    }

    // Create admin profile
    console.log('\n👨‍💼 Creating admin profile...');
    
    const admin = await Admin.create({
      userId: user._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      role: 'super_admin',
      permissions: ['*'], // All permissions
      isActive: true,
    });
    
    console.log('✅ Admin profile created');

    // Display success message
    console.log('\n🎉 SUPER ADMIN CREATED SUCCESSFULLY!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`👔 Role: Super Administrator`);
    console.log(`🔑 Permissions: Full System Access`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now login at: /auth/admin/login\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

createSuperAdmin();