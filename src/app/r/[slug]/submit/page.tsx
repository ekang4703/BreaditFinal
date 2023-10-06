import React, { useState, useEffect } from 'react';
import { Editor } from '@/components/Editor';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

const Page = ({ params }: pageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [subreddit, setSubreddit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subredditData = await db.subreddit.findFirst({
          where: {
            name: params.slug,
          },
        });

        if (subredditData) {
          setSubreddit(subredditData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setIsLoading(false); // Set loading state to false when data fetching is complete
      }
    };

    fetchData();
  }, [params.slug]);

  return (
    <div className='flex flex-col items-start gap-6'>
      {/* ... other parts of your component ... */}

      {/* form */}
      {!isLoading && <Editor subredditId={subreddit?.id} />}

      <div className='w-full flex justify-end'>
        <Button type='submit' className='w-full' form='subreddit-post-form' disabled={isLoading}>
          {isLoading ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
};

export default Page;
