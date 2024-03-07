import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: String,
  price: {
    type: Number,
    required: true
  },
  currentPrice: Number,
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  sales: [{ 
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date },
    amount: { type: Number},
  }]
});


const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
