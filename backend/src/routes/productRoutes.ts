import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, updateStock, getStockMovements } from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/movements', getStockMovements);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), createProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), updateProduct);
router.post('/:id/stock', authorize('ADMIN', 'WAREHOUSE'), updateStock);

export default router;
