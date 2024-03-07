import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import bcrypt from 'bcrypt';
import flash from 'connect-flash';
import configurePassport from './config/passport.js';

import Customer from './models/Customer.js';
import Product from './models/Product.js';

import dotenv from 'dotenv'; 
dotenv.config({ path: 'process.env' });

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

configurePassport(passport); // Configuring passport

// Session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Connect-flash setup
app.use(flash());

// Middleware to make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Define routes
import routes from './routes/routes.js'; 
app.use('/', routes);

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
