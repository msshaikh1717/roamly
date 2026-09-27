const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getAllReviews,
  setTourUserIds,
  createReview,
  deleteReview,
  updateReview,
  getReview,
} = require('./../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');

router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
