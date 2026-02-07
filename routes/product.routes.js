const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getMyProducts,
    toggleAvailability
} = require('../controllers/product.controller');
const { uploadProductImages, deleteProductImage } = require('../controllers/upload.controller');
const { protect, verifiedSeller } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Seller routes (verified sellers only)
router.post('/', protect, verifiedSeller, createProduct);
router.get('/seller/my-products', protect, verifiedSeller, getMyProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.patch('/:id/availability', protect, toggleAvailability);

// Image upload routes
router.post('/:id/upload-images', protect, upload.array('images', 5), uploadProductImages);
router.delete('/:id/images/:publicId', protect, deleteProductImage);

module.exports = router;
