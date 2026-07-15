// Test what the API is actually returning
// Run this in browser console on your profile page

fetch('https://api.clanplug.site/api/posts?userId=cmi2ntvc90000bv5rbc2r5kb0&limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('=== API RESPONSE ===');
  console.log('Total posts:', data.data.length);
  
  data.data.forEach((post, idx) => {
    console.log(`\nPost ${idx + 1}:`, {
      id: post.id,
      title: post.title?.substring(0, 50),
      hasImages: !!post.images?.length,
      images: post.images,
      hasVideos: !!post.videos?.length,
      videos: post.videos,
      hasVideoThumbnails: !!post.videoThumbnails?.length,
      videoThumbnails: post.videoThumbnails
    });
    
    // Check if video URL is in wrong array
    if (post.images?.length) {
      post.images.forEach(img => {
        if (img.match(/\.(mp4|mov|avi|webm)$/i)) {
          console.warn('⚠️ VIDEO URL FOUND IN IMAGES ARRAY:', img);
        }
      });
    }
  });
})
.catch(err => console.error('API Error:', err));
