import React from 'react';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface pageProps {
  params: {
    slug: string;
  };
}

const Page = ({ params }: pageProps) => {
  const subreddit = db.subreddit.findFirst({
    where: {
      name: params.slug,
    },
  });

  const isLoading = !subreddit; // Assuming 'subreddit' being null means loading

  return (
    <div className='flex flex-col items-start gap-6'>
      {/* ... other parts of your component ... */}

      <div className='w-full flex justify-end'>
        <Button
          type='submit'
          className='w-full'
          form='subreddit-post-form'
          isLoading={isLoading}
          onClick={() => {
            // Your button click logic here
            console.log('Button clicked!');
          }}
        >
          {isLoading ? 'Loading...' : 'Finger'}
        </Button>
      </div>
    </div>
  );
};

export default Page;
