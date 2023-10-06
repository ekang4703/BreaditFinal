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
      {/* heading /}
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

      {/ form */}
      <Editor subredditId={subreddit.id} />

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
