import type { LoaderFunction, ActionFunction } from "@remix-run/server-runtime";
import { useFormAction, useLoaderData, useCatch, Form, useFetcher, useActionData, Outlet, Link } from "@remix-run/react";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { redirect, json } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import type { BlogPost } from "~/models/blog_post.server";
import { deleteBlogPost, getBlogPostById, updateBlogPost } from "~/models/blog_post.server";
import { requireUserId } from "~/session.server";
import { Alert } from "~/components/Alert";
import Editor from "@monaco-editor/react";

import { getMDXComponent, mdxComponents } from "~/mdx";
import {ErrorBoundary as ComponentErrorBoundary} from "react-error-boundary";

import { MultiActionButton } from "~/components/MultiActionButton/MultiActionButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";

import debounce  from "lodash.debounce";



type ActionData = {
  blogPost?: Pick<BlogPost, "title" | "subTitle" | "emoji" | "body">,
  errors?: {
    title?: string;
    subTitle?: string;
    emoji?: string;
    body?: string;
  };
};

type LoaderData = {
  formType: 'create'| 'update';
  blogPost: Pick<BlogPost, "body" | "title" | "subTitle" | "slug" | "emoji" | "status">;
};



const EmojiField = React.forwardRef<any, any>(({actionData}: any, ref) => {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (actionData?.errors?.emoji) setDirty(false)
  }, [actionData]);

  return (
    <div className="grid-in-bpf-emoji">
    <label className="flex w-full flex-col gap-1">
      <span className="text-base text-yellow-100 font-saygon">Emoji: </span>
      <input
        ref={ref}
        name="emoji"
        onChange={() => {if(!dirty) setDirty(true)}}
        className="bg-black-100 text-yellow-100 font-saygon text-base focus:text-pink-200 focus:outline-none border-2 border-yellow-100  focus-visible:border-pink-200 rounded-lg p-2"
        aria-invalid={actionData?.errors?.emoji ? true : undefined}
        aria-errormessage={
          actionData?.errors?.emoji ? "emoji-error" : undefined
        }
      />
    </label>
    {!dirty && actionData?.errors?.emoji && (
      <Alert className="pt-1 text-red-100 font-saygon text-base" id="emoji=error">
        {actionData.errors.emoji}
      </Alert>
    )}
  </div>
  )
});

const TitleField = React.forwardRef<any, any>(({actionData}: any, ref: any) => {

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (actionData?.errors?.title) setDirty(false)
  }, [actionData]);

  return (
    <div className="grid-in-bpf-title">
    <label className="flex w-full flex-col gap-1">
      <span className="text-base text-yellow-100 font-saygon">Title: </span>
      <input
        ref={ref}
        name="title"
        onChange={() => {if(!dirty) setDirty(true)}}
        className="bg-black-100 text-yellow-100 font-saygon text-base focus:text-pink-200 focus:outline-none border-2 border-yellow-100  focus-visible:border-pink-200 rounded-lg p-2"
        aria-invalid={actionData?.errors?.title ? true : undefined}
        aria-errormessage={
          actionData?.errors?.title ? "title-error" : undefined
        }
      />
    </label>
    {!dirty && actionData?.errors?.title && (
      <Alert className="pt-1 text-red-100 font-saygon text-base" id="title=error">
        {actionData.errors.title}
      </Alert>
    )}
  </div>
  )
});

const SubTitleField = React.forwardRef<any, any>(({actionData}: any, ref: any) => {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (actionData?.errors?.subTitle) setDirty(false)
  }, [actionData]);


  return (
    <div className="grid-in-bpf-subTitle">
    <label className="flex w-full flex-col gap-1">
      <span className="text-base text-yellow-100 font-saygon">Sub Title: </span>
      <input
        ref={ref}
        name="subTitle"
        onChange={() => {if(!dirty) setDirty(true)}}
        className="bg-black-100 text-yellow-100 font-saygon text-base focus:text-pink-200 focus:outline-none border-2 border-yellow-100  focus-visible:border-pink-200 rounded-lg p-2"
        aria-invalid={actionData?.errors?.subTitle ? true : undefined}
        aria-errormessage={
          actionData?.errors?.subTitle ? "subtTitle-error" : undefined
        }
      />
    </label>
    {!dirty && actionData?.errors?.subTitle && (
      <Alert className="pt-1 text-red-100 font-saygon text-base" id="subTitle=error">
        {actionData.errors.subTitle}
      </Alert>
    )}
  </div>
  )
});


const BodyField = React.forwardRef(({actionData, syncScroll, fetcher, defaultValue}: any, ref: any) => {
  const [dirty, setDirty] = useState(false);


  function handleEditorDidMount(editor: any, monaco: any) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editor.onDidScrollChange((args: any) => syncScroll(args))

  }
  

  useEffect(() => {
    if (actionData?.errors?.body) setDirty(false)
  }, [actionData]);

  const debouncedCompileMDX = useMemo(() => debounce((value) => {
    fetcher.submit({mdxSource: value}, {method: 'post', action: '/api/compile-mdx'})
  }, 300),[])

  return (
    <div className="grid-in-bpf-body">
      <label className="flex w-full flex-col gap-1 max-h-[60vh] h-full">
        <span className="text-base text-yellow-100 font-saygon">Body: </span>
        <div className="mdx-editor w-full text-tiny font-mono bg-black-100 text-yellow-100 h-full">
        <Editor
              theme="vs-dark"
          defaultLanguage="html"
          defaultValue={defaultValue}
          options={{
            minimap: {
              enabled: false
            }
          }}
          onChange={value  => {
            if(!dirty) setDirty(true)
            debouncedCompileMDX(value)
            if(ref.current) ref.current.innerHTML = value;
          }}
          onMount={handleEditorDidMount}
        />
        <textarea
          hidden
          ref={ref}
          name="body"
          aria-invalid={actionData?.errors?.body ? true : undefined}
          aria-errormessage={
            actionData?.errors?.body ? "body-error" : undefined
          }
        ></textarea>
        </div>

      </label>
      {!dirty && actionData?.errors?.body && (
        <Alert className="pt-1 text-red-100 font-saygon text-base" id="body=error">
          {actionData.errors.body}
        </Alert>
      )}
    </div>
  )
})

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <Alert className="flex flex-col justify-start">
      <div className="text-red-100 font-saygon text-lg whitespace-pre-wrap mb-3">{error.message}</div>
      <div className="text-white-100 font-saygon text-md mb-3">Check your syntax and try to recompile.</div>
      <button className="btn self-center m-8" onClick={resetErrorBoundary}>Recompile</button>
    </Alert>
  );
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireUserId(request);
  if (params.id !== 'new') {
    invariant(params.id, "blog_post_id not found");

    const blogPost = await getBlogPostById({ id: params.id });
    if (!blogPost) {
      throw new Response("Not Found", { status: 404 });
    }
  
    return json<LoaderData>({ formType: 'update', blogPost });
  } else {
    return json<LoaderData>({
      formType: 'create',
      blogPost: {
        title: '',
        subTitle: '',
        slug: '',
        emoji: '',
        body: '',
        status: 'draft',
      }
    })
  }
};

export const action: ActionFunction = async ({ request, context, params }) => {
  const userId = await requireUserId(request);
  invariant(params.id, "blog_post_id not found");

  const formData = await request.formData();
  const _action = formData.get("_action");
  const title = formData.get("title");
  const subTitle = formData.get("subTitle");
  const emoji = formData.get("emoji");
  const body = formData.get("body");

  switch (_action) {
    case 'save':
    default:

      if (typeof emoji !== "string" || emoji.length === 0) {
        return json<ActionData>(
          { errors: { emoji: "Emoji is required" } },
          { status: 400 }
        );
      }

      if (typeof title !== "string" || title.length === 0) {
        return json<ActionData>(
          { errors: { title: "Title is required" } },
          { status: 400 }
        );
      }
    
      if (typeof subTitle !== "string" || subTitle.length === 0) {
        return json<ActionData>(
          { errors: { subTitle: "Sub Title is required" } },
          { status: 400 }
        );
      }
    
      if (typeof body !== "string" || body.length === 0) {
        return json<ActionData>(
          { errors: { body: "Body is required" } },
          { status: 400 }
        );
      }

      const result = await updateBlogPost({ id: params.id, title, body, subTitle, emoji, userId });
      if (result.errors) {
        return json<ActionData>(
          { errors: result?.errors },
          { status: 400 }
        );
      } else {
        return json<ActionData>(
          { blogPost: result.blogPost},
          { status: 200 }
        )
      }
      
  }
};

export default function EditBlogPostPage() {
  const {blogPost} = useLoaderData();

  const actionData = useActionData() as ActionData;
  const titleRef = React.useRef<HTMLInputElement>(null);
  const subTitleRef = React.useRef<HTMLInputElement>(null);
  const emojiRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const formPropagationBypassRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.subTitle) {
      subTitleRef.current?.focus();
    } else if (actionData?.errors?.emoji) {
      emojiRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    } 
  }, [actionData]);
  

  const fetcher = useFetcher();

  React.useEffect(() => { 
    titleRef.current?.setAttribute("value", blogPost?.title);
    subTitleRef.current?.setAttribute("value", blogPost?.subTitle);
    emojiRef.current?.setAttribute("value", blogPost?.emoji);
    if (bodyRef.current) bodyRef.current.innerHTML = blogPost?.body;
    fetcher.submit({mdxSource: blogPost?.body}, {method: 'post', action: '/api/compile-mdx'});
  }, []);


  const syncScroll = useCallback(({scrollHeight, scrollTop}: any) => {
    if (formPropagationBypassRef.current) {
      formPropagationBypassRef.current.style.transform = `translateY(${-scrollTop}px)`
    }
  }, []);

  
  const Component = useMemo(() => 
    fetcher?.data?.code
    ? getMDXComponent(fetcher?.data?.code) 
    : () => (
        <Alert className="h-full text-red-100 text-md font-saygon flex items-center justify-center">
          {fetcher?.data?.error}
        </Alert>
      )
    , [fetcher?.data?.code, fetcher?.data?.error]);


  return (
    <>
    <Form
      method="post"
      className="min-h-screen p-6 w-full grid grid-areas-blog-post-content-form grid-cols-blog-post-content-form grid-rows-blog-post-content-form gap-6"
    >
      <EmojiField ref={emojiRef} actionData={actionData}/>
      <TitleField ref={titleRef} actionData={actionData}/>
      <SubTitleField ref={subTitleRef} actionData={actionData}/>

      <BodyField ref={bodyRef} actionData={actionData} fetcher={fetcher} syncScroll={syncScroll} defaultValue={blogPost?.body}/>
      <div className="grid-in-bpf-preview mt-6 markdown overflow-hidden max-h-[100%]">
        <div ref={formPropagationBypassRef}></div>
      </div>
      

      <div className="grid-in-bpf-submit flex items-center w-full justify-end">
      <button
          key="save"
          name="_action"
          value="save"
          type="submit"
          className="btn"
              >
              Save
            </button>
      </div>
      

    </Form>
    {formPropagationBypassRef?.current && ReactDOM.createPortal(
      <ComponentErrorBoundary
        FallbackComponent={ErrorFallback}
      >
        <Component components={mdxComponents}/>
      </ComponentErrorBoundary>
    , formPropagationBypassRef?.current)}
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Blog Post not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
