import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, addNote } from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', authorize('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorize('ADMIN', 'SALES'), updateCustomer);
router.post('/:id/notes', authorize('ADMIN', 'SALES'), addNote);

export default router;
