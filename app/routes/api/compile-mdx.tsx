import type { ActionFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import { compileMDX } from "~/compile-mdx.server";


export const action: ActionFunction = async ({request}) => {
  try {
    const formData = await request.formData();
    const mdxSource = formData.get("mdxSource");
    const {code}  = await compileMDX({mdxSource});
    return json({code});
  } catch {
    return json({error: 'Invalid element or syntax.'})
  }
};
