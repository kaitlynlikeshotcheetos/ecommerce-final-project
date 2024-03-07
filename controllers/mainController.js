import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const home = async (req, res) => {
  try {
    let customer = await Customer.findById(req.user._id);
    if (!customer.cart) {
      customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    }
    if (!customer.purchases) {
      customer.purchases = { items: [], totalQuantity: 0, totalPrice: 0 };
    } 
    await customer.save();
  
    const products = await Product.find();
    res.render('index', { products }); 
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while loading the home page');
    res.redirect('/');
  }
};

export const getProducts = async (req, res) => {
  const { name, sortBy } = req.body;
  let query = {};

  if (name) {
    query.name = { $regex: `.*${name}.*`, $options: 'i' }; // Case-insensitive search
  }

  let sortOption = {};
  if (sortBy === 'name') {
    sortOption = { name: 1 }; // Sort alphabetically
  } else if (sortBy === 'price') {
    sortOption = { price: -1 }; // Sort by price (descending)
  } else if (sortBy === 'stock') {
    sortOption = { stock: -1 }; // Sort by stock (descending)
  }

  try {
    const products = await Product.find(query).sort(sortOption);
    res.json(products); // Send back JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    req.flash('error', 'An error occurred while fetching products');
    res.status(500).send(error);
  }
};


export const homename = async (req, res) => {
    try {
        // Check if the referrer is login or register
        const referrer = req.get('Referrer');
        if (referrer && (referrer.endsWith('/login') || referrer.endsWith('/register'))) {
            // If the user arrived from login or register, pass the username to the view
            res.render('index', { username: req.user.username });
        } else {
            // If not, render the index page without passing the username
            res.render('index');
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while loading the home page');
        res.status(500).send('An error occurred');
    }
};

export const addToCart = async (req, res) => {
    try {
        let { productId, quantity } = req.body;
        quantity = parseInt(quantity);
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.status(404).send('Product not found');
        }

        if (quantity > product.stock) {
            req.flash('error', 'Requested quantity exceeds available stock');
            return res.redirect('/');
        }

        const price = product.price;

        const userId = req.user._id;
        let customer = await Customer.findOne({ _id: userId });
        
        if (!customer.cart) {
            customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
        } else {
            const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                customer.cart.items[itemIndex].quantity += quantity;
                customer.cart.items[itemIndex].price = price;
            } else {
                customer.cart.items.push({ productId, quantity, price });
            }
            customer.cart.totalQuantity += quantity;
            customer.cart.totalPrice += price * quantity;
        }

        product.stock -= quantity;
        await product.save();

        await customer.save();
        req.flash('success', 'Product added to cart successfully');
        res.redirect('/');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while adding the product to the cart');
        res.redirect('/');
    }
};

export const clearCart = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.user });

        for (const cartItem of customer.cart.items) {
            const productId = cartItem.productId;
            const quantityInCart = cartItem.quantity;

            const product = await Product.findById(productId);
            if (product) {
                product.stock += quantityInCart; // Add cart items back to available stock
                await product.save();
            }
        }
        customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
        await customer.save();

        req.flash('success', 'Cart cleared successfully');
        res.redirect('/showCart');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while clearing the cart');
        res.redirect('/');
    }
};

export const showCart = async (req, res) => {
  try {
    const populatedCustomer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    res.render('cart', { user: populatedCustomer });
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while loading the cart page');
    res.status(500).send('An error occurred');
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const customer = await Customer.findOne({ _id: req.user });

    // Find the index of the item to be removed
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);

    // Check if the item exists in the cart
    if (itemIndex === -1) {
      req.flash('error', 'Product not found in the cart');
      return res.redirect('/showCart');
    }

    // Restore available quantity
    const product = await Product.findById(productId);
    product.stock += parseInt(quantity);
    await product.save();

    // Update total quantity and price
    customer.cart.totalQuantity -= parseInt(quantity);
    customer.cart.totalPrice -= product.price * parseInt(quantity);

    // Remove the item from the cart
    customer.cart.items.splice(itemIndex, 1);

    await customer.save();

    req.flash('success', 'Product removed from cart successfully');
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while removing the product from the cart');
    res.redirect('/showCart');
  }
}


export const purchase = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');

    const cartItems = customer.cart.items;

    // Calculate total purchase price
    let totalPurchasePrice = 0;
    cartItems.forEach(cartItem => {
      const { quantity, price } = cartItem;
      totalPurchasePrice += quantity * price;
    });

    // Deduct purchase price from user's money
    customer.money -= totalPurchasePrice;

    // Check if the user has enough money for the purchase
    if (customer.money < 0) {
      return res.status(400).send('Insufficient funds');
    }

    // Update user's purchases
    customer.purchases.items.push(...cartItems);
    customer.purchases.totalQuantity += customer.cart.totalQuantity;
    customer.purchases.totalPrice += totalPurchasePrice;

    // Clear user's cart
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };

    await customer.save();
    req.flash('success', 'Purchase completed successfully');
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while completing the purchase');
    res.status(500).send('An error occurred');
  }
};

export const customer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('purchases.items.productId');

    res.render('customer', {user: customer}); 
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while loading the customer page');
    res.status(500).send('An error occurred');
  }
}

