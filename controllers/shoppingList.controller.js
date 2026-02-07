const ShoppingList = require('../models/ShoppingList.model');
const User = require('../models/User.model');

// @desc    Create shopping list
// @route   POST /api/shopping-lists
// @access  Private (Buyer)
exports.createShoppingList = async (req, res) => {
    try {
        const { items, shippingAddress, buyerNotes } = req.body;

        const shoppingList = await ShoppingList.create({
            buyer: req.user._id,
            items,
            shippingAddress,
            buyerNotes,
            status: 'pending'
        });

        await shoppingList.populate('buyer', 'firstName lastName email phone');

        res.status(201).json({
            success: true,
            message: 'Shopping list submitted successfully',
            data: shoppingList
        });
    } catch (error) {
        console.error('Create shopping list error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating shopping list'
        });
    }
};

// @desc    Get all shopping lists (Admin/CS)
// @route   GET /api/shopping-lists
// @access  Private (Admin/CS)
exports.getAllShoppingLists = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const shoppingLists = await ShoppingList.find(query)
            .populate('buyer', 'firstName lastName email phone')
            .populate('assignedTo', 'firstName lastName phone')
            .populate('customerService', 'firstName lastName')
            .sort('-createdAt')
            .limit(Number(limit))
            .skip(skip);

        const total = await ShoppingList.countDocuments(query);

        res.status(200).json({
            success: true,
            count: shoppingLists.length,
            total,
            data: shoppingLists
        });
    } catch (error) {
        console.error('Get shopping lists error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shopping lists'
        });
    }
};

// @desc    Get single shopping list
// @route   GET /api/shopping-lists/:id
// @access  Private
exports.getShoppingList = async (req, res) => {
    try {
        const shoppingList = await ShoppingList.findById(req.params.id)
            .populate('buyer', 'firstName lastName email phone address')
            .populate('assignedTo', 'firstName lastName phone')
            .populate('customerService', 'firstName lastName')
            .populate('items.product');

        if (!shoppingList) {
            return res.status(404).json({
                success: false,
                message: 'Shopping list not found'
            });
        }

        res.status(200).json({
            success: true,
            data: shoppingList
        });
    } catch (error) {
        console.error('Get shopping list error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shopping list'
        });
    }
};

// @desc    Assign shopping list to agent (CS)
// @route   POST /api/shopping-lists/:id/assign
// @access  Private (CS/Admin)
exports.assignShoppingList = async (req, res) => {
    try {
        const { agentId, notes } = req.body;

        const agent = await User.findById(agentId);
        if (!agent || agent.role !== 'agent') {
            return res.status(400).json({
                success: false,
                message: 'Invalid agent ID'
            });
        }

        const shoppingList = await ShoppingList.findByIdAndUpdate(
            req.params.id,
            {
                assignedTo: agentId,
                customerService: req.user._id,
                status: 'assigned',
                internalNotes: notes
            },
            { new: true }
        ).populate('buyer assignedTo customerService');

        res.status(200).json({
            success: true,
            message: 'Shopping list assigned to agent',
            data: shoppingList
        });
    } catch (error) {
        console.error('Assign shopping list error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning shopping list'
        });
    }
};

// @desc    Update shopping list status
// @route   PATCH /api/shopping-lists/:id/status
// @access  Private (CS/Admin)
exports.updateShoppingListStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const shoppingList = await ShoppingList.findByIdAndUpdate(
            req.params.id,
            { status, internalNotes: notes },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: shoppingList
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status'
        });
    }
};
