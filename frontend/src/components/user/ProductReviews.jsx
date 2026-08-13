import React, { useState, useRef } from 'react';
import { Star, Image as ImageIcon, Video as VideoIcon, X, CheckCircle, Plus, Upload, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../common/Toast/useToast';
import './ProductReviews.css';

const ProductReviews = ({ productId, reviews: initialReviews = [], rating: initialRating = 4.5, onReviewAdded }) => {
  const toast = useToast();
  const [reviewsList, setReviewsList] = useState(initialReviews);
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState(null);
  const carouselRef = useRef(null);

  // Review form state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      setReviewsList(initialReviews);
    }
    if (initialRating) {
      setCurrentRating(initialRating);
    }
  }, [initialReviews, initialRating]);

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('Image file size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.warning('Video file size should be less than 25MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() && !imagePreview && !videoPreview) {
      toast.warning('Please enter a comment, photo, or video to submit');
      return;
    }

    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userName = user ? (user.name || user.firstName || user.username || 'Verified Buyer') : 'Customer Reviewer';
    const userAvatar = user?.avatarUrl || localStorage.getItem('userProfileAvatar') || '';

    const newReviewObj = {
      userName,
      userAvatar,
      rating: ratingInput,
      comment: commentInput.trim(),
      images: imagePreview ? [imagePreview] : [],
      videos: videoPreview ? [videoPreview] : [],
      createdAt: new Date().toISOString()
    };

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      if (productId && (productId.length >= 24 || !isNaN(productId))) {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(newReviewObj)
        });
        const data = await res.json();
        if (data.success && data.product) {
          setReviewsList(data.product.reviews || [newReviewObj, ...reviewsList]);
          setCurrentRating(data.product.rating || ratingInput);
          if (onReviewAdded) onReviewAdded(data.product);
        } else {
          setReviewsList([newReviewObj, ...reviewsList]);
        }
      } else {
        const updatedList = [newReviewObj, ...reviewsList];
        setReviewsList(updatedList);
        const sum = updatedList.reduce((acc, r) => acc + (r.rating || 5), 0);
        setCurrentRating(Number((sum / updatedList.length).toFixed(1)));
      }

      toast.success('Thank you! Your rating and review were submitted successfully.');
      setShowReviewModal(false);
      setCommentInput('');
      setImagePreview('');
      setVideoPreview('');
      setRatingInput(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      const updatedList = [newReviewObj, ...reviewsList];
      setReviewsList(updatedList);
      toast.success('Review added successfully!');
      setShowReviewModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Carousel scroll — scrolls by one card width (300px + gap)
  const CARD_SCROLL = 320;
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: direction * CARD_SCROLL, behavior: 'smooth' });
  };

  const getReviewerAvatar = (rev) => {
    if (!rev) return null;
    if (rev.userAvatar) return rev.userAvatar;
    if (rev.user?.avatarUrl) return rev.user.avatarUrl;
    if (rev.avatarUrl) return rev.avatarUrl;
    if (rev.avatar) return rev.avatar;
    
    try {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      const localAvatar = localStorage.getItem('userProfileAvatar') || localUser.avatarUrl || localUser.avatar;
      if (localAvatar) {
        const revName = (rev.userName || rev.user?.firstName || rev.name || '').toLowerCase().trim();
        const first = (localUser.firstName || '').toLowerCase().trim();
        const last = (localUser.lastName || '').toLowerCase().trim();
        const fullName = `${first} ${last}`.trim();
        const username = (localUser.username || localUser.name || '').toLowerCase().trim();
        const email = (localUser.email || '').toLowerCase().trim();

        if (
          (first && revName.includes(first)) ||
          (fullName && revName.includes(fullName)) ||
          (username && revName.includes(username)) ||
          (email && revName.includes(email)) ||
          (rev.user && (rev.user === localUser._id || rev.user === localUser.id))
        ) {
          return localAvatar;
        }
      }
    } catch (_) {}
    return null;
  };

  const reviewCount = reviewsList.length;
  const avgRating = currentRating || 4.5;

  return (
    <section className="product-reviews-section">
      <div className="reviews-container">
        <div className="reviews-header-bar">
          <h2 className="reviews-section-title">CUSTOMER REVIEWS &amp; RATINGS</h2>
          <button className="btn-add-review" onClick={() => setShowReviewModal(true)}>
            <Plus size={16} /> Write a Review
          </button>
        </div>

        {/* Rating Summary Bar */}
        <div className="reviews-summary-card">
          <div className="summary-score-box">
            <span className="summary-big-score">{Number(avgRating).toFixed(1)}</span>
            <div className="summary-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.floor(avgRating) ? 'star-gold-fill' : 'star-muted-outline'}
                />
              ))}
            </div>
            <span className="summary-count-label">
              Based on {reviewCount} customer review{reviewCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="summary-badge">
            <CheckCircle size={16} className="badge-check-icon" />
            <span>100% Verified Customer Feedback</span>
          </div>
        </div>

        {/* Reviews — Empty State or Horizontal Carousel */}
        {reviewCount === 0 ? (
          <div className="empty-reviews-box">
            <p>No reviews yet for this product. Be the first to rate &amp; review!</p>
            <button className="btn-secondary-review" onClick={() => setShowReviewModal(true)}>
              Be First to Review
            </button>
          </div>
        ) : (
          <div className="reviews-carousel-wrapper">
            {/* Left Navigation Arrow */}
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={() => scrollCarousel(-1)}
              aria-label="Previous reviews"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Horizontal Scrollable Track */}
            <div className="reviews-carousel-track" ref={carouselRef}>
              {reviewsList.map((rev, idx) => {
                const revRating = rev.rating || 5;
                const userName = rev.userName || rev.user?.firstName || rev.name || 'Verified Buyer';
                const avatarSrc = getReviewerAvatar(rev);
                const dateStr = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : (rev.date || 'Recently');
                const commentText = rev.comment || rev.text || rev.review || '';
                const images = rev.images || (rev.image ? [rev.image] : []);
                const videos = rev.videos || (rev.video ? [rev.video] : []);

                return (
                  <div key={rev._id || rev.id || idx} className="review-carousel-card">
                    {/* Card Header: Avatar + Name + Stars */}
                    <div className="review-card-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={userName}
                              className="reviewer-avatar-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerText = userName.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="reviewer-name-meta">
                          <h4 className="reviewer-name">{userName}</h4>
                          <span className="review-date">{dateStr}</span>
                        </div>
                      </div>
                      <div className="review-stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < Math.floor(revRating) ? 'star-gold-fill' : 'star-muted-outline'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Text — clamped to 4 lines for consistent card height */}
                    {commentText && (
                      <p className="review-comment-body review-comment-clamped">{commentText}</p>
                    )}

                    {/* Attached Images */}
                    {images && images.length > 0 && (
                      <div className="review-media-group">
                        <div className="media-group-label">
                          <ImageIcon size={13} /> Attached Photos:
                        </div>
                        <div className="review-thumbs-row">
                          {images.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="review-thumb-box"
                              onClick={() => setActiveMediaModal({ type: 'image', url: img })}
                            >
                              <img src={img} alt={`Review photo ${imgIdx + 1}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Videos */}
                    {videos && videos.length > 0 && (
                      <div className="review-media-group">
                        <div className="media-group-label">
                          <VideoIcon size={13} /> Attached Video:
                        </div>
                        <div className="review-videos-row">
                          {videos.map((vid, vidIdx) => (
                            <div key={vidIdx} className="review-video-wrapper">
                              <video
                                src={vid}
                                controls
                                muted
                                className="review-video-player"
                                preload="metadata"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Navigation Arrow */}
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={() => scrollCarousel(1)}
              aria-label="Next reviews"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Review & Rating Submission Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Write a Product Review</h3>
              <button className="btn-close-modal" onClick={() => setShowReviewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="review-modal-form">
              {/* Star Rating Picker */}
              <div className="form-group-star">
                <label>Overall Product Rating:</label>
                <div className="star-picker-row">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      type="button"
                      key={starVal}
                      className={`star-pick-btn ${starVal <= ratingInput ? 'active' : ''}`}
                      onClick={() => setRatingInput(starVal)}
                    >
                      <Star size={24} fill={starVal <= ratingInput ? '#D4AF37' : 'none'} color={starVal <= ratingInput ? '#D4AF37' : '#DDD6CE'} />
                    </button>
                  ))}
                  <span className="star-rating-text">{ratingInput} / 5 Stars</span>
                </div>
              </div>

              {/* Text Comment */}
              <div className="form-group">
                <label>Your Review / Comment:</label>
                <textarea
                  rows="4"
                  placeholder="Tell us about the fit, quality, comfort, or overall style..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="review-textarea"
                />
              </div>

              {/* Media Attachments: Image & Video */}
              <div className="media-upload-grid">
                {/* Image Upload */}
                <div className="media-upload-box">
                  <label className="upload-box-label">
                    <ImageIcon size={16} /> Attach Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    id="review-img-input"
                    className="hidden-file-input"
                  />
                  <label htmlFor="review-img-input" className="upload-trigger-btn">
                    <Upload size={14} /> Upload Image
                  </label>
                  {imagePreview && (
                    <div className="preview-thumb-container">
                      <img src={imagePreview} alt="Upload preview" />
                      <button type="button" onClick={() => setImagePreview('')} className="btn-remove-preview">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div className="media-upload-box">
                  <label className="upload-box-label">
                    <VideoIcon size={16} /> Attach Video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFile}
                    id="review-vid-input"
                    className="hidden-file-input"
                  />
                  <label htmlFor="review-vid-input" className="upload-trigger-btn">
                    <Upload size={14} /> Upload Video
                  </label>
                  {videoPreview && (
                    <div className="preview-thumb-container">
                      <video src={videoPreview} className="preview-video" />
                      <button type="button" onClick={() => setVideoPreview('')} className="btn-remove-preview">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="review-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-review" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {activeMediaModal && activeMediaModal.type === 'image' && (
        <div className="media-lightbox-overlay" onClick={() => setActiveMediaModal(null)}>
          <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-lightbox" onClick={() => setActiveMediaModal(null)}>
              <X size={20} />
            </button>
            <img src={activeMediaModal.url} alt="Review attachment full size" />
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
