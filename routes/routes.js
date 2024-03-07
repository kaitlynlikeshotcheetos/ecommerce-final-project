import express from 'express';
import * as ctrl from '../controllers/mainController.js';
import * as auth from '../controllers/authController.js';

const router = express.Router();

router.get('/login', auth.login);
router.post('/login', auth.verifyLogin);
router.get('/register', auth.register);
router.post('/register', auth.verifyRegister);
router.get('/logout', auth.logout);

router.get('/', auth.isAuthenticated, ctrl.home);
router.post('/api/products', auth.isAuthenticated, ctrl.getProducts);
router.get('/showCart', auth.isAuthenticated, ctrl.showCart);
router.post('/addToCart', auth.isAuthenticated, ctrl.addToCart);
router.get('/clearCart', auth.isAuthenticated, ctrl.clearCart);
router.post('/purchase', auth.isAuthenticated, ctrl.purchase);
router.get('/customer', auth.isAuthenticated, ctrl.customer);
router.post('/removeFromCart', auth.isAuthenticated, ctrl.removeFromCart);

export default router;