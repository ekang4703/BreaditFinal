import React, { useState, useEffect } from 'react';
import { Editor } from '@/components/Editor';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface pageProps {
  params: {
    slug: string;
  };
}

const Page = ({ params }: pageProps) => {
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true); // Set loading state to true when data fetching starts
    fetchData();
  }, [params.slug]);

  return (
    <div className='flex flex-col items-start gap-6'>
      {/* heading */}
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

      {/* form */}
      {isLoading ? (
        <p>Loading...</p> // You can replace this with a loading spinner or any loading component you prefer
      ) : (
        <Editor subredditId={subreddit?.id} />
      )}

      <div className='w-full flex justify-end'>
        <Button type='submit' className='w-full' form='subreddit-post-form'>
          Post
        </Button>
      </div>
    </div>
  );
};

export default Page;
