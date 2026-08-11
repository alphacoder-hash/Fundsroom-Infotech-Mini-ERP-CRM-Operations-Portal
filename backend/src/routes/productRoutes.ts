import { Router } from 'express';
import multer from 'multer';
import { getProducts, getProduct, createProduct, updateProduct, updateStock, getStockMovements, uploadProductImage } from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/movements', getStockMovements);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), createProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), updateProduct);
router.post('/:id/stock', authorize('ADMIN', 'WAREHOUSE'), updateStock);
router.post('/:id/image', authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), uploadProductImage);

export default router;
