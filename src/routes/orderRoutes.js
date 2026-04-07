const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();

router.get('/', OrderController.getOrders);
router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrder);
router.get('/user/:userId', OrderController.getOrdersByUser);
router.delete('/:id', OrderController.deleteOrder);
router.get('/stats/overview', OrderController.getOrderStats);

module.exports = router;