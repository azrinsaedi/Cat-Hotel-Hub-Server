import { Router } from 'express';
import { validateHotelInput } from '../middleware/validationMiddleware.js';
import {
  authenticateUser,
  checkForTestUser,
} from '../middleware/authMiddleware.js';
import upload from '../middleware/multerMiddleware.js';
checkForTestUser;
const router = Router();

import {
  getCurrentAdmin,
  showAllHotels,
  addHotel,
  getHotel,
  editHotel,
  deleteHotel,
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  forgotPasswordAdmin,
  executeForgotPasswordAdmin,
  updateAdmin,
  changePasswordAdmin,
  showAllBookingAdmin,
  showSingleBookingAdmin,
  cancelAdminBooking,
  getAdminApplicationStats,
  showStats,
} from '../controllers/adminController.js';

import rateLimiter from 'express-rate-limit';

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { msg: 'IP rate limit exceeded, retry in 15 minutes.' },
});

router.get('/current-admin', authenticateUser, getCurrentAdmin);

router.route('/register').post(apiLimiter, registerAdmin); //later add validation input
router.route('/login').post(apiLimiter, loginAdmin); //later add validation input
router.route('/logout').get(logoutAdmin);
router.route('/forgot-password').get(checkForTestUser, forgotPasswordAdmin);
router
  .route('/forgot-password/:id/:token')
  .get(checkForTestUser, executeForgotPasswordAdmin);
router
  .route('/forgot-password/change-password')
  .post(checkForTestUser, changePasswordAdmin);
router.patch(
  '/admin',
  checkForTestUser,
  upload.single('avatar'),
  authenticateUser,
  updateAdmin
);
router
  .route('/bookings')
  .get(checkForTestUser, authenticateUser, showAllBookingAdmin);
router
  .route('/booking/:id')
  .get(checkForTestUser, authenticateUser, showSingleBookingAdmin);
router
  .route('/booking/:id')
  .delete(checkForTestUser, authenticateUser, cancelAdminBooking);
router.route('/').get(authenticateUser, showAllHotels);

router.post(
  '/',
  checkForTestUser,
  // validateHotelInput,
  upload.array('images', 8),
  authenticateUser,
  addHotel
);
router.route('/app-stats').get(authenticateUser, getAdminApplicationStats);
router.route('/stats').get(authenticateUser, showStats);
router
  .route('/:id')
  .get(checkForTestUser, authenticateUser, getHotel)
  .patch(checkForTestUser, authenticateUser, editHotel)
  .delete(checkForTestUser, authenticateUser, deleteHotel);

export default router;
