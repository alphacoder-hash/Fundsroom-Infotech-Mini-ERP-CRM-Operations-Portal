import { Router } from 'express';
import { getChallans, getChallan, createChallan, updateChallanStatus } from '../controllers/challanController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallan);
router.post('/', authorize('ADMIN', 'SALES'), createChallan);
router.patch('/:id/status', authorize('ADMIN', 'SALES'), updateChallanStatus);

export default router;
