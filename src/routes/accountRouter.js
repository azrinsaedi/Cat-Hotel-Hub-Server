import { Router } from 'express';
import upload from '../middleware/multerMiddleware.js';
const router = Router();

import {
  registerAccount,
  loginAccount,
  logoutAccount,
  forgotPasswordAccount,
  executeForgotPasswordAccount,
  changePasswordAccount,
  updateAccount,
  addPet,
  showAllBookings,
  showSingleBookings,
  cancelCustomerBooking,
  showAllPets,
  addBooking,
  editPet,
  deletePet,
  getCurrentUser,
  getApplicationStats,
  getSinglePet,
  getCurrentUserDetails,
  getCurrentUserFetch,
  postComment,
  updateBookingSuccess,
  postAddWishlist,
} from '../controllers/accountController.js';

import {
  authenticateAccount,
  authorizePermissions,
} from '../middleware/authMiddleware.js';

router.route('/register').post(registerAccount); //later add validation input
router.route('/login').post(loginAccount); //later add validation input
router.route('/logout').get(logoutAccount);
router.route('/forgot-password').get(forgotPasswordAccount);
router.route('/forgot-password/:id/:token').get(executeForgotPasswordAccount);
router.route('/forgot-password/change-password').post(changePasswordAccount);
router.patch('/update-account', authenticateAccount, updateAccount);
router
  .route('/pet')
  .post(upload.array('images', 4), authenticateAccount, addPet);
router.route('/pet/:id').get(authenticateAccount, getSinglePet);
router.route('/pet/:id').patch(authenticateAccount, editPet);
router.route('/pet/:id').delete(authenticateAccount, deletePet);
router.route('/pets').get(authenticateAccount, showAllPets);
router.route('/booking').post(authenticateAccount, addBooking);
router.route('/booking').patch(authenticateAccount, updateBookingSuccess);
router.route('/bookings').get(authenticateAccount, showAllBookings);
router.route('/booking/:id').get(authenticateAccount, showSingleBookings);
router.route('/booking/:id').delete(authenticateAccount, cancelCustomerBooking);

router.get('/current-user', authenticateAccount, getCurrentUser);
router.get('/current-user-fetch', getCurrentUserFetch);
router.get('/current-user-details', authenticateAccount, getCurrentUserDetails);
router.post('/add-wishlist/:id', authenticateAccount, postAddWishlist);

router.post(
  '/hotel/comment/:id',
  upload.array('images', 4),
  authenticateAccount,
  postComment
);
router.get(
  '/admin/app-stats',
  authorizePermissions('admin'),
  getApplicationStats
);

export default router;
