const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ user: userId }).sort({
      date: -1,
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    // Get active budgets
    const now = new Date();
    const budgets = await Budget.find({
      user: userId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    // Calculate spent amounts for budgets
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Transaction.find({
          user: userId,
          category: budget.category,
          type: 'expense',
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate,
          },
        }).then((txns) => txns.reduce((sum, t) => sum + t.amount, 0));

        return {
          ...budget.toObject(),
          spent,
          remaining: budget.amount - spent,
          percentage: Math.min(100, (spent / budget.amount) * 100),
        };
      })
    );

    return res.json({
      income,
      expenses,
      balance,
      transactions,
      budgets: budgetsWithSpent,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type } = req.query;

    const query = { user: userId };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  auth,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type')
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').notEmpty().withMessage('Date is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const { amount, type, category, date, note } = req.body;

      const transaction = new Transaction({
        user: userId,
        amount,
        type,
        category,
        date,
        note,
      });

      await transaction.save();
      return res.status(201).json(transaction);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:id',
  auth,
  [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('type')
      .optional()
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: req.body },
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      return res.json(transaction);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.json({ message: 'Transaction deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

