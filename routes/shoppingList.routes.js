const express = require('express');
const router = express.Router();
const {
    createShoppingList,
    getAllShoppingLists,
    getShoppingList,
    assignShoppingList,
    updateShoppingListStatus
} = require('../controllers/shoppingList.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Create shopping list (buyers)
router.post('/', protect, createShoppingList);

// Get all shopping lists (admin/CS)
router.get('/', protect, authorize('admin', 'super_admin', 'customer_service'), getAllShoppingLists);

// Get single shopping list
router.get('/:id', protect, getShoppingList);

// Assign to agent (CS/admin)
router.post('/:id/assign', protect, authorize('admin', 'super_admin', 'customer_service'), assignShoppingList);

// Update status
router.patch('/:id/status', protect, authorize('admin', 'super_admin', 'customer_service'), updateShoppingListStatus);

module.exports = router;
