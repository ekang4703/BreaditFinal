import React from 'react';
import { useMutation } from '@tanstack/react-query'
import { Editor } from '@/components/Editor';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface pageProps {
  params: {
    slug: string;
  };
}

const mockMutation = async () => {
  // Simulate an asynchronous operation (e.g., API request) with a delay
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated 2-second delay
  // Return some mock data (optional)
  return { success: true };
};

const Page = ({ params }: pageProps) => {
  const { mutate, isLoading } = useMutation(mockMutation);

  const handleSubmit = () => {
    mutate(); // Call the mock mutation function
  };

  const subreddit = db.subreddit.findFirst({
    where: {
      name: params.slug,
    },
  });

  if (!subreddit) {
    notFound();
    return null; // Return null when subreddit is not found
  }

  return (
    <div className='flex flex-col items-start gap-6'>
      <div className='border-b border-gray-200 pb-5'>
        <div className='-ml-2 -mt-2 flex flex-wrap items-baseline'>
          <h3 className='ml-2 mt-2 text-base font-semibold leading-6 text-gray-900'>
            Create Post
          </h3>
          <p className='ml-2 mt-1 truncate text-sm text-gray-500'>
            in r/{params.slug}
          </p>
        </div>
      </div>

      <Editor subredditId={subreddit.id} />

      <div className='w-full flex justify-end'>
        <Button
          type='submit'
          className='w-full'
          form='subreddit-post-form'
          isLoading={isLoading}
          onClick={handleSubmit}
        >
          Finger
        </Button>
      </div>
    </div>
  );
};

export default Page;
