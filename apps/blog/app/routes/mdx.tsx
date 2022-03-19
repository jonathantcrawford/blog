import type { ActionFunction } from "remix";
import { json } from "remix";

import { compileMDX } from "~/compile-mdx.server";


export const action: ActionFunction = async ({request}) => {
  const formData = await request.formData();
  const mdxSource = formData.get("mdxSource");
  const code  = await compileMDX({mdxSource});
  return json(code);
};
