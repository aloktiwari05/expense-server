const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate spent amount for a budget
async function calculateSpentAmount(userId, category, startDate, endDate) {
  const transactions = await Transaction.find({
    user: userId,
    category,
    type: 'expense',
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Get all budgets for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ user: userId }).sort({ createdAt: -1 });

    // Calculate current spent amounts
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpentAmount(
          userId,
          budget.category,
          budget.startDate,
          budget.endDate
        );
        return {
          ...budget.toObject(),
          spent,
        };
      })
    );

    return res.json(budgetsWithSpent);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a new budget
router.post(
  '/',
  auth,
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('period').isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
    body('startDate').notEmpty().withMessage('Start date is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const { category, amount, period, startDate } = req.body;

      const start = new Date(startDate);
      const end = new Date(start);

      if (period === 'monthly') {
        end.setMonth(end.getMonth() + 1);
      } else {
        end.setFullYear(end.getFullYear() + 1);
      }

      const budget = new Budget({
        user: userId,
        category,
        amount,
        period,
        startDate: start,
        endDate: end,
      });

      await budget.save();

      // Calculate initial spent amount
      const spent = await calculateSpentAmount(userId, category, start, end);

      return res.status(201).json({
        ...budget.toObject(),
        spent,
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a budget
router.put(
  '/:id',
  auth,
  [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('period').optional().isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const { id } = req.params;

      const budget = await Budget.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: req.body },
        { new: true }
      );

      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }

      // Recalculate spent amount
      const spent = await calculateSpentAmount(
        userId,
        budget.category,
        budget.startDate,
        budget.endDate
      );

      return res.json({
        ...budget.toObject(),
        spent,
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    return res.json({ message: 'Budget deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;