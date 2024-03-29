'use client'

import EditorJS from '@editorjs/editorjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, FC } from 'react'
import { useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { z } from 'zod'

import { Answer } from "@/components/Answer/Answer";
import type { PGChunk } from "@/PGtypes/index";
import endent from "endent";

import { toast } from '@/hooks/use-toast'
import { uploadFiles } from '@/lib/uploadthing'
import { PostCreationRequest, PostValidator } from '@/lib/validators/post'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'

import '@/styles/editor.css'

import { CommentRequest } from '@/lib/validators/comment'
import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/db'

let realId = ''

type FormData = z.infer<typeof PostValidator>

interface EditorProps {
  subredditId: string
}

export const Editor: React.FC<EditorProps> = ({ subredditId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId,
      title: '',
      content: null,
    },
  })
  const ref = useRef<EditorJS>()
  const _titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const pathname = usePathname()

  
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState<string>("");
  const [chunks, setChunks] = useState<PGChunk[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [mode, setMode] = useState<"search" | "chat">("chat");
  const [matchCount, setMatchCount] = useState<number>(3);
  const [apiKey, setApiKey] = useState<string>(process.env.OPENAI_API_KEY!);
  

  const { mutate: createPost } = useMutation({
    mutationFn: async ({
      title,
      content,
      subredditId,
    }: PostCreationRequest) => {
      const payload: PostCreationRequest = { title, content, subredditId }
      
      const { data } = await axios.post('/api/subreddit/post/create', payload)
      
      return data
    },
    onError: () => {
      return toast({
        title: 'Something went wrong.',
        description: 'An error occured. Your post was not published. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
            
      let realId = data
      
      let rId: string = realId.id;
      let rText: string = realId.content;
      let finalText = JSON.stringify(rText)

      const startIdx = finalText.indexOf('"text":"') + '"text":"'.length;
      const endIdx = finalText.indexOf('"}', startIdx);
      const extractedText = finalText.substring(startIdx, endIdx);

      async function createComment(commentPayload: CommentRequest) {
        try {
          const { data } = await axios.patch(`/api/subreddit/post/comment/`, commentPayload);
          return data;
        } catch (error) {
          console.error("Error creating your comment:", error);
          throw error; 
        }
      }

      let query = extractedText;
      
      const handleAnswer = async () => {
        try {
          if (!query) {
            alert("Please Input Query.");
            return;
          }
      
          setAnswer("Hi");
          setChunks([]);
      
          setLoading(true);
      
          let response = await axios.post('/api/subreddit/post/extra/', { query, apiKey, matches: matchCount }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          let searchResponse: PGChunk[] = response.data;

          let sources = searchResponse.map((source, index) => (
            `<div key=${index}>
              <div className="mt-4 border border-zinc-600 rounded-lg p-4" style="margin-top: 1rem; border: 1px solid #438099; border-radius: 0.5rem; padding: 1rem;">
                <div className="flex justify-between" style="display: flex; justify-content: space-between;">
                  <div>
                    <div className="font-bold text-xl" style="font-weight: bold; font-size: 1.25rem;">${source.essay_title}</div>
                    <div className="mt-1 font-bold text-sm" style="margin-top: 0.25rem; font-weight: bold; font-size: 0.875rem;">${source.essay_date}</div>
                  </div>
                  <a
                    className="hover:opacity-50 ml-2"
                    href=${source.essay_url}
                    target="_blank"
                    rel="noreferrer"
                    style="color: blue"
                  >
                    🔗
                  </a>
                </div>
                <div className="mt-2" style="margin-top: 0.5rem;">${source.content}</div>
              </div>
            </div>`
          )).join('');
          console.log("INCOMING SOURCES")
          console.log(sources)
      
          setChunks(searchResponse);
      
          const prompt = endent`
          Use the following passages to provide an answer to the query: "${query}"
      
          ${searchResponse?.map((d: any) => d.content).join("\n\n")}
          `;
      
          let answerResponse = await axios.post('/api/subreddit/post/extraAnswer/', { prompt, apiKey }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
     
          let data1: string = answerResponse.data;

          let finalResponse = `
            <div className="mt-6" sstyle="margin-top: 1.5rem;">
            <div className="font-bold text-2xl mb-2" style="font-weight: bold; margin-bottom: 0.5rem;">${data1}</div> 
            <div className="mt-6 mb-16" style="margin-top: 1.5rem; margin-bottom: 4rem;">
              <div className="font-bold text-2xl" style="font-weight: bold; font-size: 1.5rem;">Sources</div>
              ${sources}
            </div>
            </div>
          `;
          console.log("INCOMING FINALRESPONSE")
          console.log(finalResponse)
          console.log(typeof finalResponse)
          console.log(finalResponse.length)
          
          const payload: CommentRequest = {
            postId: rId,
            text: finalResponse,
            replyToId: undefined,
          }
          await createComment(payload)
          
          setLoading(false);
          inputRef.current?.focus();
        } catch (error) {
          console.error("Error occurred:", error);
        }
      };

      handleAnswer().then(() => {
          const newPathname = pathname.split('/').slice(0, -1).join('/');
          router.push(newPathname);
          router.refresh();
          toast({
              description: 'Your post has been successfully published.',
          });
      });
    },
  })

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default
    const Header = (await import('@editorjs/header')).default
    const Embed = (await import('@editorjs/embed')).default
    const Table = (await import('@editorjs/table')).default
    const List = (await import('@editorjs/list')).default
    const Code = (await import('@editorjs/code')).default
    const LinkTool = (await import('@editorjs/link')).default
    const InlineCode = (await import('@editorjs/inline-code')).default
    const ImageTool = (await import('@editorjs/image')).default

    if (!ref.current) {
      const editor = new EditorJS({
        holder: 'editor',
        onReady() {
          ref.current = editor
        },
        placeholder: 'Type your question here...',
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/link',
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  // upload to uploadthing
                  const [res] = await uploadFiles([file], 'imageUploader')

                  return {
                    success: 1,
                    file: {
                      url: res.fileUrl,
                    },
                  }
                },
              },
            },
          },
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      })
    }
  }, [])

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [_key, value] of Object.entries(errors)) {
        value
        toast({
          title: 'Something went wrong.',
          description: (value as { message: string }).message,
          variant: 'destructive',
        })
      }
    }
  }, [errors])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await initializeEditor()

      setTimeout(() => {
        _titleRef?.current?.focus()
      }, 0)
    }

    if (isMounted) {
      init()

      return () => {
        ref.current?.destroy()
        ref.current = undefined
      }
    }
  }, [isMounted, initializeEditor])

  async function onSubmit(data: FormData) {
    setLoading(true);
    
    try {
      const blocks = await ref.current?.save();
  
      const PostPayload: PostCreationRequest = {
        title: data.title,
        content: blocks,
        subredditId,
      };

      await createPost(PostPayload);
    } finally {
      setLoading(false);
    }
  }
  
  if (!isMounted) {
    return null
  }

  const { ref: titleRef, ...rest } = register('title')

  return (
    <div className='w-full p-4 bg-zinc-50 rounded-lg border border-zinc-200'>
    {loading && <div className={`style text-2xl font-bold text-color-438099`}>Processing...</div>}
      <form
        id='subreddit-post-form'
        className='w-fit'
        onSubmit={handleSubmit(onSubmit)}>
        <div className='prose prose-stone dark:prose-invert'>
          <TextareaAutosize
            ref={(e) => {
              titleRef(e)
              // @ts-ignore
              _titleRef.current = e
            }}
            {...rest}
            placeholder='Title'
            className='w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none'
          />
          <div id='editor' className='min-h-[500px]' />
          <p className='text-sm text-gray-500'>
            Use{' '}
            <kbd className='rounded-md border bg-muted px-1 text-xs uppercase'>
              Tab
            </kbd>{' '}
            to open the command menu.
          </p>
        </div>
      </form>
    </div>
  )
}
