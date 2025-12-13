'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostModal from '@/components/PostModal';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !postId) {
    return null;
  }

  return (
    <PostModal 
      postId={postId} 
      onClose={() => router.back()} 
    />
  );
}
